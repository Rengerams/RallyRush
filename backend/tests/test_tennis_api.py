"""
Backend API tests for RENFFR OPEN Tennis App
Tests: Root endpoint, Matches CRUD, Leaderboard aggregation
"""
import pytest
import requests
import os
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

class TestRootEndpoint:
    """Test root API endpoint"""
    
    def test_root_returns_api_message(self):
        """GET /api/ should return RENFFR OPEN Tennis API message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "RENFFR OPEN Tennis API"
        print("✓ Root endpoint returns correct message")


class TestMatchesEndpoint:
    """Test matches CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_match_payload = {
            "player_name": "TEST_Player",
            "won": True,
            "difficulty": "hard",
            "ai_style": "baseline",
            "surface": "hard",
            "match_format": "quick",
            "sets": [[3, 1]],
            "duration_sec": 300,
            "legend": False,
            "stats": {
                "aces": 2,
                "double_faults": 1,
                "winners": 10,
                "errors": 5,
                "perfect_shots": 8,
                "total_shots": 50,
                "longest_rally": 12,
                "points_won": 15
            },
            "opponent_points": 8
        }
        yield
        # Cleanup: No direct delete endpoint, but test data is prefixed with TEST_
    
    def test_create_match_success(self):
        """POST /api/matches should create a match and return it"""
        response = requests.post(f"{BASE_URL}/api/matches", json=self.test_match_payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["player_name"] == "TEST_Player"
        assert data["won"] == True
        assert data["difficulty"] == "hard"
        assert data["surface"] == "hard"
        assert data["rating_points"] == 35  # Hard win = 35 points
        assert "created_at" in data
        print(f"✓ Match created with id: {data['id']}, rating_points: {data['rating_points']}")
    
    def test_create_match_easy_loss_rating(self):
        """POST /api/matches with easy loss should give 2 rating points"""
        payload = self.test_match_payload.copy()
        payload["player_name"] = "TEST_LossPlayer"
        payload["won"] = False
        payload["difficulty"] = "easy"
        
        response = requests.post(f"{BASE_URL}/api/matches", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["rating_points"] == 2  # Loss = 2 points
        print(f"✓ Loss match gives 2 rating points")
    
    def test_create_match_pro_win_rating(self):
        """POST /api/matches with pro win should give 60 rating points"""
        payload = self.test_match_payload.copy()
        payload["player_name"] = "TEST_ProPlayer"
        payload["difficulty"] = "pro"
        
        response = requests.post(f"{BASE_URL}/api/matches", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["rating_points"] == 60  # Pro win = 60 points
        print(f"✓ Pro win gives 60 rating points")
    
    def test_create_match_invalid_difficulty(self):
        """POST /api/matches with invalid difficulty should return 422"""
        payload = self.test_match_payload.copy()
        payload["difficulty"] = "ultra"  # Invalid
        
        response = requests.post(f"{BASE_URL}/api/matches", json=payload)
        assert response.status_code == 422
        print("✓ Invalid difficulty returns 422")
    
    def test_create_match_invalid_surface(self):
        """POST /api/matches with invalid surface should return 422"""
        payload = self.test_match_payload.copy()
        payload["surface"] = "concrete"  # Invalid - only hard, clay, grass allowed
        
        response = requests.post(f"{BASE_URL}/api/matches", json=payload)
        assert response.status_code == 422
        print("✓ Invalid surface returns 422")
    
    def test_list_matches(self):
        """GET /api/matches should return list of matches"""
        response = requests.get(f"{BASE_URL}/api/matches")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List matches returns {len(data)} matches")
    
    def test_list_matches_filter_by_player(self):
        """GET /api/matches?player=TEST_Player should filter by player name"""
        # First create a match
        requests.post(f"{BASE_URL}/api/matches", json=self.test_match_payload)
        
        response = requests.get(f"{BASE_URL}/api/matches?player=TEST_Player")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned matches should be for TEST_Player (case-insensitive)
        for match in data:
            assert match["player_name"].lower() == "test_player"
        print(f"✓ Filter by player returns {len(data)} matches")
    
    def test_list_matches_filter_by_surface(self):
        """GET /api/matches?surface=hard should filter by surface"""
        response = requests.get(f"{BASE_URL}/api/matches?surface=hard")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for match in data:
            assert match["surface"] == "hard"
        print(f"✓ Filter by surface returns {len(data)} matches")


class TestLeaderboardEndpoint:
    """Test leaderboard aggregation"""
    
    def test_leaderboard_returns_list(self):
        """GET /api/leaderboard should return list of player stats"""
        response = requests.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Leaderboard returns {len(data)} entries")
    
    def test_leaderboard_structure(self):
        """GET /api/leaderboard entries should have correct structure"""
        # First create a match to ensure leaderboard has data
        test_payload = {
            "player_name": "TEST_LeaderboardPlayer",
            "won": True,
            "difficulty": "medium",
            "ai_style": "baseline",
            "surface": "hard",
            "match_format": "quick",
            "sets": [[4, 2]],
            "duration_sec": 400,
            "legend": False,
            "stats": {
                "aces": 3,
                "double_faults": 0,
                "winners": 12,
                "errors": 4,
                "perfect_shots": 10,
                "total_shots": 60,
                "longest_rally": 15,
                "points_won": 18
            },
            "opponent_points": 10
        }
        requests.post(f"{BASE_URL}/api/matches", json=test_payload)
        
        response = requests.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            entry = data[0]
            required_fields = ["player_name", "matches", "wins", "losses", "win_pct", 
                            "rating", "best_rally", "aces", "perfect_shots", "legend"]
            for field in required_fields:
                assert field in entry, f"Missing field: {field}"
            print(f"✓ Leaderboard entry has all required fields")
        else:
            print("⚠ Leaderboard is empty, skipping structure check")
    
    def test_leaderboard_sorted_by_rating(self):
        """GET /api/leaderboard should be sorted by rating descending"""
        response = requests.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 1:
            ratings = [entry["rating"] for entry in data]
            assert ratings == sorted(ratings, reverse=True), "Leaderboard not sorted by rating"
            print("✓ Leaderboard is sorted by rating descending")
        else:
            print("⚠ Not enough entries to verify sorting")


class TestNewSurfaces:
    """Test that new surfaces (Kunstgras, Smashcourt) work in API"""
    
    def test_kunstgras_surface_works(self):
        """API should accept artificial (Kunstgras) surface"""
        payload = {
            "player_name": "TEST_KunstgrasTest",
            "won": True,
            "difficulty": "medium",
            "ai_style": "baseline",
            "surface": "artificial",  # Kunstgras id
            "match_format": "quick",
            "sets": [[3, 1]],
            "duration_sec": 300,
            "legend": False,
            "stats": {
                "aces": 1, "double_faults": 0, "winners": 5, "errors": 2,
                "perfect_shots": 4, "total_shots": 30, "longest_rally": 8, "points_won": 10
            },
            "opponent_points": 5
        }
        response = requests.post(f"{BASE_URL}/api/matches", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["surface"] == "artificial"
        print("✓ Kunstgras (artificial) surface accepted by API")
    
    def test_smashcourt_surface_works(self):
        """API should accept smashcourt surface"""
        payload = {
            "player_name": "TEST_SmashcourtTest",
            "won": True,
            "difficulty": "hard",
            "ai_style": "aggressive",
            "surface": "smashcourt",
            "match_format": "quick",
            "sets": [[3, 1]],
            "duration_sec": 450,
            "legend": False,
            "stats": {
                "aces": 2, "double_faults": 1, "winners": 8, "errors": 3,
                "perfect_shots": 6, "total_shots": 40, "longest_rally": 10, "points_won": 12
            },
            "opponent_points": 7
        }
        response = requests.post(f"{BASE_URL}/api/matches", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["surface"] == "smashcourt"
        print("✓ Smashcourt surface accepted by API")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
