"""Local regression tests for result-shape validation and submission throttling."""
import os
import sys
from pathlib import Path

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "renffr_test")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from pydantic import ValidationError

from server import MatchIn, MATCH_POST_LIMIT, MATCH_POST_WINDOW_SECONDS, _allow_match_submission, _match_submission_events


def _payload(match_format="quick", sets=None):
    return {
        "player_name": "Validation Tester",
        "won": True,
        "difficulty": "medium",
        "ai_style": "baseline",
        "surface": "hard",
        "match_format": match_format,
        "sets": sets if sets is not None else [[3, 1]],
        "stats": {},
    }


@pytest.mark.parametrize("scores", [[[3, 1]], [[4, 2]], [[3, 3]]])
def test_quick_match_accepts_completed_set_scores(scores):
    MatchIn(**_payload(sets=scores))


@pytest.mark.parametrize("scores", [[], [[0, 0]], [[3, 2]], [[4, 1]], [[5, 3]]])
def test_quick_match_rejects_incomplete_or_unreachable_scores(scores):
    with pytest.raises(ValidationError):
        MatchIn(**_payload(sets=scores))


def test_standard_match_accepts_two_or_three_completed_sets():
    MatchIn(**_payload("standard", [[6, 4], [6, 2]]))
    MatchIn(**_payload("standard", [[6, 4], [3, 6], [7, 5]]))
    MatchIn(**_payload("standard", [[6, 6], [6, 2]]))


@pytest.mark.parametrize("scores", [[[6, 5], [6, 2]], [[7, 4], [6, 2]], [[6, 2]]])
def test_standard_match_rejects_incomplete_or_unreachable_results(scores):
    with pytest.raises(ValidationError):
        MatchIn(**_payload("standard", scores))


def test_match_submission_limit_allows_a_normal_match_burst_then_throttles():
    client = "unit-test-rate-limit"
    _match_submission_events.pop(client, None)
    for i in range(MATCH_POST_LIMIT):
        assert _allow_match_submission(client, now=100 + i / 10)
    assert not _allow_match_submission(client, now=101)
    assert _allow_match_submission(client, now=100 + MATCH_POST_WINDOW_SECONDS)


