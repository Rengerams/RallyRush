"""Iteration 5 backend regression for matches, history, leaderboard and new stats payloads."""

import os
import time
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values


def _resolve_base_url() -> str:
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


def _tag() -> str:
    return str(int(time.time() * 1000) % 1_000_000)


def _payload(player_name: str, surface: str = "hard"):
    return {
        "player_name": player_name,
        "won": True,
        "difficulty": "hard",
        "ai_style": "aggressive",
        "surface": surface,
        "match_format": "quick",
        "sets": [[3, 1]],
        "duration_sec": 240,
        "legend": False,
        "stats": {
            "aces": 2,
            "double_faults": 0,
            "winners": 7,
            "errors": 3,
            "perfect_shots": 5,
            "total_shots": 30,
            "longest_rally": 10,
            "points_won": 14,
        },
        "opponent_points": 9,
    }


# Module: root and API availability
def test_root_api_health(api_client):
    response = api_client.get(f"{BASE_URL}/api/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "RENFFR OPEN Tennis API"


# Module: create payload persistence with extended stats fields
def test_create_match_and_verify_via_history_query(api_client):
    player = f"T5_PERSIST_{_tag()}"
    payload = _payload(player, surface="smashcourt")
    payload["opponent_stats"] = {
        "aces": 1,
        "double_faults": 1,
        "winners": 3,
        "errors": 4,
        "perfect_shots": 2,
        "total_shots": 28,
        "longest_rally": 10,
        "points_won": 9,
    }
    payload["rally_lengths"] = [1, 4, 6, 11]

    create_response = api_client.post(f"{BASE_URL}/api/matches", json=payload)
    assert create_response.status_code == 200
    created = create_response.json()
    assert created["surface"] == "smashcourt"
    assert created["opponent_stats"]["double_faults"] == 1
    assert created["rally_lengths"] == [1, 4, 6, 11]
    assert isinstance(created["id"], str)

    # CREATE -> GET verification
    list_response = api_client.get(f"{BASE_URL}/api/matches", params={"player": player, "surface": "smashcourt", "limit": 10})
    assert list_response.status_code == 200
    rows = list_response.json()
    saved = next((r for r in rows if r["id"] == created["id"]), None)
    assert saved is not None
    assert saved["stats"]["longest_rally"] == 10
    assert saved["opponent_stats"]["points_won"] == 9


# Module: backward compatibility for old payloads without new fields
def test_create_match_legacy_payload_without_new_fields(api_client):
    player = f"T5_LEGACY_{_tag()}"
    payload = _payload(player, surface="hard")

    response = api_client.post(f"{BASE_URL}/api/matches", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["player_name"] == player
    assert data["opponent_stats"] is None
    assert data["rally_lengths"] == []


# Module: input validation for rally lengths
def test_negative_rally_lengths_rejected(api_client):
    payload = _payload(f"T5_BAD_{_tag()}")
    payload["rally_lengths"] = [2, -1, 5]

    response = api_client.post(f"{BASE_URL}/api/matches", json=payload)
    assert response.status_code == 422


# Module: surface acceptance matrix
@pytest.mark.parametrize("surface", ["hard", "clay", "grass", "artificial", "smashcourt"])
def test_all_five_surfaces_supported(api_client, surface):
    code = {"hard": "HA", "clay": "CL", "grass": "GR", "artificial": "AR", "smashcourt": "SM"}[surface]
    payload = _payload(f"T5_S_{code}_{_tag()}", surface=surface)
    response = api_client.post(f"{BASE_URL}/api/matches", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["surface"] == surface


# Module: leaderboard regression after new stats
def test_leaderboard_structure_and_order(api_client):
    response = api_client.get(f"{BASE_URL}/api/leaderboard", params={"limit": 20})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        row = data[0]
        assert isinstance(row["player_name"], str)
        assert isinstance(row["rating"], int)
        ratings = [r["rating"] for r in data]
        assert ratings == sorted(ratings, reverse=True)


# Module: history filters and response integrity
def test_history_filters_player_and_surface(api_client):
    player = f"T5_FILTER_{_tag()}"
    payload = _payload(player, surface="clay")
    create_response = api_client.post(f"{BASE_URL}/api/matches", json=payload)
    assert create_response.status_code == 200
    created = create_response.json()

    player_resp = api_client.get(f"{BASE_URL}/api/matches", params={"player": player, "limit": 10})
    assert player_resp.status_code == 200
    player_rows = player_resp.json()
    assert any(r["id"] == created["id"] for r in player_rows)
    assert all(r["player_name"].lower() == player.lower() for r in player_rows)

    surface_resp = api_client.get(f"{BASE_URL}/api/matches", params={"surface": "clay", "limit": 10})
    assert surface_resp.status_code == 200
    surface_rows = surface_resp.json()
    assert all(r["surface"] == "clay" for r in surface_rows)
