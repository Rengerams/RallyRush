"""Regression tests for safe result retries and match-list validation."""
import os
import uuid

import pytest
import requests


# These integration tests write a match record. They must never inherit
# the frontend's deployment URL; opt in only with an isolated test backend.
BASE_URL = os.getenv("TEST_BACKEND_URL", "").rstrip("/")
RUN_API_INTEGRATION_TESTS = os.getenv("RUN_API_INTEGRATION_TESTS") == "1"
if not RUN_API_INTEGRATION_TESTS or not BASE_URL:
    pytest.skip(
        "Set RUN_API_INTEGRATION_TESTS=1 and TEST_BACKEND_URL to an isolated test API",
        allow_module_level=True,
    )


def _match_payload(match_id):
    return {
        "match_id": match_id,
        "player_name": "TEST_IDEMPOTENCY",
        "won": True,
        "difficulty": "easy",
        "ai_style": "baseline",
        "surface": "hard",
        "match_format": "quick",
        "sets": [[3, 0]],
        "duration_sec": 110,
        "legend": False,
        "stats": {
            "aces": 1, "double_faults": 0, "winners": 3,
            "errors": 0, "perfect_shots": 2, "total_shots": 10,
            "longest_rally": 4, "points_won": 12,
        },
    }


def test_repeating_match_post_is_idempotent():
    uid = str(uuid.uuid4())
    payload = _match_payload(uid)
    first = requests.post(f"{BASE_URL}/api/matches", json=payload, timeout=15)
    retry = requests.post(f"{BASE_URL}/api/matches", json=payload, timeout=15)
    assert first.status_code == 200
    assert retry.status_code == 200
    assert first.json()["id"] == retry.json()["id"]
    assert first.json()["match_id"] == uid


@pytest.mark.parametrize("endpoint", ["matches", "leaderboard"])
def test_limit_zero_rejected(endpoint):
    response = requests.get(f"{BASE_URL}/api/{endpoint}", params={"limit": 0}, timeout=15)
    assert response.status_code == 422


def test_invalid_match_id_rejected():
    response = requests.post(
        f"{BASE_URL}/api/matches",
        json=_match_payload("invalid id!"),
        timeout=15,
    )
    assert response.status_code == 422
