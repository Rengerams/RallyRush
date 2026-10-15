"""Local regression tests for score validation and submission throttling."""
import os
import sys
from pathlib import Path

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "renffr_test")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from pydantic import ValidationError

from server import MatchIn, MATCH_POST_LIMIT, MATCH_POST_WINDOW_SECONDS, _allow_match_submission, _match_submission_events


def _payload(match_format="quick", sets=None, won=True):
    return {
        "player_name": "Validation Tester",
        "won": won,
        "difficulty": "medium",
        "ai_style": "baseline",
        "surface": "hard",
        "match_format": match_format,
        "sets": sets if sets is not None else [[3, 1]],
        "stats": {},
    }


@pytest.mark.parametrize("scores", [[[3, 0]], [[3, 1]], [[4, 2]], [[4, 3]]])
def test_quick_match_accepts_scores_the_engine_can_finish(scores):
    MatchIn(**_payload(sets=scores))


@pytest.mark.parametrize("scores", [[[3, 2]], [[3, 3]], [[4, 1]], [[5, 3]], [], [[0, 0]]])
def test_quick_match_rejects_incomplete_or_unreachable_scores(scores):
    with pytest.raises(ValidationError):
        MatchIn(**_payload(sets=scores))


def test_quick_match_winner_must_match_set_score():
    with pytest.raises(ValidationError):
        MatchIn(**_payload(sets=[[1, 3]], won=True))
    MatchIn(**_payload(sets=[[1, 3]], won=False))


def test_standard_match_accepts_two_or_three_completed_sets():
    MatchIn(**_payload("standard", [[6, 4], [6, 2]]))
    MatchIn(**_payload("standard", [[6, 4], [3, 6], [7, 5]]))
    MatchIn(**_payload("standard", [[6, 4], [3, 6], [7, 6]]))


@pytest.mark.parametrize("scores", [
    [[6, 5], [6, 2]],
    [[7, 4], [6, 2]],
    [[6, 6], [6, 2]],
    [[6, 2]],
    [[6, 2], [6, 4], [3, 6]],
])
def test_standard_match_rejects_incomplete_or_unreachable_results(scores):
    with pytest.raises(ValidationError):
        MatchIn(**_payload("standard", scores))


def test_standard_match_winner_must_match_completed_set_sequence():
    with pytest.raises(ValidationError):
        MatchIn(**_payload("standard", [[6, 2], [3, 6]], won=True))
    MatchIn(**_payload("standard", [[6, 2], [3, 6], [4, 6]], won=False))


def test_match_submission_limit_allows_a_normal_match_burst_then_throttles():
    client = "unit-test-rate-limit"
    _match_submission_events.pop(client, None)
    for i in range(MATCH_POST_LIMIT):
        assert _allow_match_submission(client, now=100 + i / 10)
    assert not _allow_match_submission(client, now=101)
    assert _allow_match_submission(client, now=100 + MATCH_POST_WINDOW_SECONDS)
