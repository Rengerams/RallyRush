"""Regression tests for match payload compatibility and new stats fields."""

import os
import time
import pytest
import requests
from pathlib import Path
from dotenv import dotenv_values


def _resolve_base_url():
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if not url:
        env_path = Path(__file__).resolve().parents[2] / "frontend" / ".env"
        if env_path.exists():
            url = dotenv_values(env_path).get("REACT_APP_BACKEND_URL")
    return (url or "").rstrip("/")


BASE_URL = _resolve_base_url()

if not BASE_URL:
    pytest.skip("REACT_APP_BACKEND_URL is not configured", allow_module_level=True)


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _base_payload(player_name: str, surface: str = "hard"):
    return {
        "player_name": player_name,
        "won": True,
        "difficulty": "medium",
        "ai_style": "baseline",
        "surface": surface,
        "match_format": "quick",
        "sets": [[3, 1]],
        "duration_sec": 180,
        "legend": False,
        "stats": {
            "aces": 1,
            "double_faults": 0,
            "winners": 4,
            "errors": 2,
            "perfect_shots": 3,
            "total_shots": 20,
            "longest_rally": 7,
            "points_won": 12,
        },
        "opponent_points": 8,
    }


def _tag():
    return str(int(time.time() * 1000) % 1_000_000)


# Module: POST /api/matches compatibility and serialization
def test_create_match_with_opponent_stats_and_rally_lengths(api_client):
    payload = _base_payload(f"T4_NEW_{_tag()}")
    payload["opponent_stats"] = {
        "aces": 0,
        "double_faults": 1,
        "winners": 2,
        "errors": 3,
        "perfect_shots": 1,
        "total_shots": 18,
        "longest_rally": 7,
        "points_won": 8,
    }
    payload["rally_lengths"] = [1, 3, 5, 8]

    response = api_client.post(f"{BASE_URL}/api/matches", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert isinstance(data["id"], str)
    assert data["id"]
    assert data["opponent_stats"]["double_faults"] == 1
    assert data["rally_lengths"] == [1, 3, 5, 8]


# Module: backward compatibility for old payloads
def test_create_match_old_payload_still_works(api_client):
    payload = _base_payload(f"T4_OLD_{_tag()}")
    response = api_client.post(f"{BASE_URL}/api/matches", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["player_name"].startswith("T4_OLD_")
    assert data["opponent_stats"] is None
    assert data["rally_lengths"] == []


# Module: validation for rally_lengths
def test_create_match_negative_rally_length_rejected(api_client):
    payload = _base_payload(f"T4_BAD_{_tag()}")
    payload["rally_lengths"] = [2, -1, 4]

    response = api_client.post(f"{BASE_URL}/api/matches", json=payload)
    assert response.status_code == 422


# Module: GET /api/matches should include newly persisted fields
def test_get_matches_includes_new_fields(api_client):
    player = f"T4_GET_{_tag()}"
    payload = _base_payload(player, surface="clay")
    payload["opponent_stats"] = {
        "aces": 2,
        "double_faults": 0,
        "winners": 5,
        "errors": 1,
        "perfect_shots": 4,
        "total_shots": 22,
        "longest_rally": 9,
        "points_won": 10,
    }
    payload["rally_lengths"] = [2, 4, 7]

    create_resp = api_client.post(f"{BASE_URL}/api/matches", json=payload)
    assert create_resp.status_code == 200
    created = create_resp.json()

    get_resp = api_client.get(f"{BASE_URL}/api/matches", params={"player": player, "surface": "clay", "limit": 5})
    assert get_resp.status_code == 200
    rows = get_resp.json()

    saved = next((r for r in rows if r["id"] == created["id"]), None)
    assert saved is not None
    assert saved["opponent_stats"]["winners"] == 5
    assert saved["rally_lengths"] == [2, 4, 7]


# Module: leaderboard stability after new fields
def test_leaderboard_still_works(api_client):
    response = api_client.get(f"{BASE_URL}/api/leaderboard", params={"limit": 10})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert "player_name" in data[0]
        assert "rating" in data[0]


# Module: verify all five surfaces accepted by API
@pytest.mark.parametrize("surface", ["hard", "clay", "grass", "artificial", "smashcourt"])
def test_all_surfaces_create_match(api_client, surface):
    payload = _base_payload(f"T4_{surface[:2].upper()}_{_tag()}", surface=surface)
    response = api_client.post(f"{BASE_URL}/api/matches", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["surface"] == surface
