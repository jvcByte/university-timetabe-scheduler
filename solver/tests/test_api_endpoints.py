"""
Pytest tests for solver service API endpoints.

Tests the FastAPI endpoints using TestClient to verify:
- API authentication
- Request/response validation
- Generation endpoint
- Validation endpoint
- Health check endpoint
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import Day


# Test client fixture
@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def api_key():
    """Return the test API key."""
    return "development-solver-api-key-change-in-production"


@pytest.fixture
def sample_payload():
    """Create a sample generation payload."""
    return {
        "courses": [
            {
                "id": 1,
                "code": "CS101",
                "title": "Introduction to Programming",
                "duration": 90,
                "department": "Computer Science",
                "room_type": "Lab",
                "instructor_ids": [1],
                "group_ids": [1]
            },
            {
                "id": 2,
                "code": "MATH201",
                "title": "Calculus I",
                "duration": 60,
                "department": "Mathematics",
                "room_type": "Lecture",
                "instructor_ids": [2],
                "group_ids": [1]
            }
        ],
        "instructors": [
            {
                "id": 1,
                "name": "Dr. Smith",
                "department": "Computer Science",
                "teaching_load": 10,
                "availability": {
                    "MONDAY": ["08:00-18:00"],
                    "TUESDAY": ["08:00-18:00"],
                    "WEDNESDAY": ["08:00-18:00"],
                    "THURSDAY": ["08:00-18:00"],
                    "FRIDAY": ["08:00-18:00"]
                }
            },
            {
                "id": 2,
                "name": "Dr. Johnson",
                "department": "Mathematics",
                "teaching_load": 10,
                "availability": {
                    "MONDAY": ["09:00-17:00"],
                    "TUESDAY": ["09:00-17:00"],
                    "WEDNESDAY": ["09:00-17:00"],
                    "THURSDAY": ["09:00-17:00"],
                    "FRIDAY": ["09:00-17:00"]
                }
            }
        ],
        "rooms": [
            {
                "id": 1,
                "name": "Lab A",
                "capacity": 30,
                "type": "Lab",
                "equipment": ["Computers", "Projector"]
            },
            {
                "id": 2,
                "name": "Lecture Hall B",
                "capacity": 50,
                "type": "Lecture",
                "equipment": ["Projector", "Whiteboard"]
            }
        ],
        "groups": [
            {
                "id": 1,
                "name": "CS Year 1",
                "size": 25,
                "course_ids": [1, 2]
            }
        ],
        "constraints": {
            "hard": {
                "noRoomDoubleBooking": True,
                "noInstructorDoubleBooking": True,
                "roomCapacityCheck": True,
                "roomTypeMatch": True
            },
            "soft": {
                "instructorPreferencesWeight": 5,
                "compactSchedulesWeight": 7,
                "balancedDailyLoadWeight": 6,
                "preferredRoomsWeight": 3
            },
            "working_hours_start": "08:00",
            "working_hours_end": "18:00"
        },
        "time_limit_seconds": 30
    }


class TestHealthEndpoint:
    """Tests for the health check endpoint."""
    
    def test_health_check(self, client):
        """Test health check endpoint returns success."""
        response = client.get("/api/v1/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "solver"
        assert "version" in data


class TestAuthentication:
    """Tests for API key authentication."""
    
    def test_generate_without_api_key(self, client, sample_payload):
        """Test generation endpoint rejects requests without API key."""
        response = client.post("/api/v1/generate", json=sample_payload)
        assert response.status_code == 403
    
    def test_generate_with_invalid_api_key(self, client, sample_payload):
        """Test generation endpoint rejects invalid API key."""
        headers = {"X-API-Key": "invalid-key"}
        response = client.post("/api/v1/generate", json=sample_payload, headers=headers)
        assert response.status_code == 401
    
    def test_validate_without_api_key(self, client, sample_payload):
        """Test validation endpoint rejects requests without API key."""
        payload = {**sample_payload, "assignments": []}
        response = client.post("/api/v1/validate", json=payload)
        assert response.status_code == 403
    
    def test_validate_with_invalid_api_key(self, client, sample_payload):
        """Test validation endpoint rejects invalid API key."""
        headers = {"X-API-Key": "invalid-key"}
        payload = {**sample_payload, "assignments": []}
        response = client.post("/api/v1/validate", json=payload, headers=headers)
        assert response.status_code == 401


class TestGenerationEndpoint:
    """Tests for the timetable generation endpoint."""
    
    def test_generate_success(self, client, api_key, sample_payload):
        """Test successful timetable generation."""
        headers = {"X-API-Key": api_key}
        response = client.post("/api/v1/generate", json=sample_payload, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data
        assert "assignments" in data
        assert "fitness_score" in data
        assert "violations" in data
        assert "solve_time_seconds" in data
        assert "message" in data
        
        if data["success"]:
            assert isinstance(data["assignments"], list)
            assert len(data["assignments"]) > 0
            assert data["fitness_score"] is not None
    
    def test_generate_with_invalid_payload(self, client, api_key):
        """Test generation with invalid payload structure."""
        headers = {"X-API-Key": api_key}
        invalid_payload = {"courses": []}  # Missing required fields
        
        response = client.post("/api/v1/generate", json=invalid_payload, headers=headers)
        assert response.status_code == 422
    
    def test_generate_with_infeasible_problem(self, client, api_key):
        """Test generation with infeasible constraints."""
        headers = {"X-API-Key": api_key}
        
        # Create infeasible problem: course needs Lab but only Lecture room available
        infeasible_payload = {
            "courses": [
                {
                    "id": 1,
                    "code": "CS101",
                    "title": "Programming",
                    "duration": 90,
                    "department": "CS",
                    "room_type": "Lab",
                    "instructor_ids": [1],
                    "group_ids": [1]
                }
            ],
            "instructors": [
                {
                    "id": 1,
                    "name": "Dr. Smith",
                    "department": "CS",
                    "teaching_load": 10,
                    "availability": {"MONDAY": ["09:00-17:00"]}
                }
            ],
            "rooms": [
                {
                    "id": 1,
                    "name": "Lecture Hall",
                    "capacity": 50,
                    "type": "Lecture"
                }
            ],
            "groups": [
                {
                    "id": 1,
                    "name": "Group 1",
                    "size": 30,
                    "course_ids": [1]
                }
            ],
            "constraints": {
                "hard": {"roomTypeMatch": True},
                "soft": {},
                "working_hours_start": "08:00",
                "working_hours_end": "18:00"
            },
            "time_limit_seconds": 10
        }
        
        response = client.post("/api/v1/generate", json=infeasible_payload, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "No room of type" in data["message"] or "infeasible" in data["message"].lower()


class TestValidationEndpoint:
    """Tests for the timetable validation endpoint."""
    
    def test_validate_valid_timetable(self, client, api_key, sample_payload):
        """Test validation of a valid timetable."""
        headers = {"X-API-Key": api_key}
        
        # Add valid assignments
        payload = {
            **sample_payload,
            "assignments": [
                {
                    "course_id": 1,
                    "instructor_id": 1,
                    "room_id": 1,
                    "group_id": 1,
                    "day": "MONDAY",
                    "start_time": "09:00",
                    "end_time": "10:30"
                },
                {
                    "course_id": 2,
                    "instructor_id": 2,
                    "room_id": 2,
                    "group_id": 1,
                    "day": "MONDAY",
                    "start_time": "11:00",
                    "end_time": "12:00"
                }
            ]
        }
        
        response = client.post("/api/v1/validate", json=payload, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "is_valid" in data
        assert "conflicts" in data
        assert isinstance(data["conflicts"], list)
        assert data["is_valid"] is True
        assert len(data["conflicts"]) == 0
    
    def test_validate_room_conflict(self, client, api_key, sample_payload):
        """Test validation detects room conflicts."""
        headers = {"X-API-Key": api_key}
        
        # Add conflicting assignments (same room, overlapping time)
        payload = {
            **sample_payload,
            "assignments": [
                {
                    "course_id": 1,
                    "instructor_id": 1,
                    "room_id": 1,
                    "group_id": 1,
                    "day": "MONDAY",
                    "start_time": "09:00",
                    "end_time": "10:30"
                },
                {
                    "course_id": 2,
                    "instructor_id": 2,
                    "room_id": 1,  # Same room!
                    "group_id": 1,
                    "day": "MONDAY",
                    "start_time": "09:30",  # Overlapping!
                    "end_time": "11:00"
                }
            ]
        }
        
        response = client.post("/api/v1/validate", json=payload, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["is_valid"] is False
        assert len(data["conflicts"]) > 0
        assert any(c["constraint_type"] == "room_conflict" for c in data["conflicts"])
    
    def test_validate_instructor_conflict(self, client, api_key, sample_payload):
        """Test validation detects instructor conflicts."""
        headers = {"X-API-Key": api_key}
        
        # Add conflicting assignments (same instructor, overlapping time)
        payload = {
            **sample_payload,
            "assignments": [
                {
                    "course_id": 1,
                    "instructor_id": 1,
                    "room_id": 1,
                    "group_id": 1,
                    "day": "MONDAY",
                    "start_time": "09:00",
                    "end_time": "10:30"
                },
                {
                    "course_id": 2,
                    "instructor_id": 1,  # Same instructor!
                    "room_id": 2,
                    "group_id": 1,
                    "day": "MONDAY",
                    "start_time": "10:00",  # Overlapping!
                    "end_time": "11:00"
                }
            ]
        }
        
        response = client.post("/api/v1/validate", json=payload, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["is_valid"] is False
        assert len(data["conflicts"]) > 0
        assert any(c["constraint_type"] == "instructor_conflict" for c in data["conflicts"])
    
    def test_validate_capacity_violation(self, client, api_key, sample_payload):
        """Test validation detects room capacity violations."""
        headers = {"X-API-Key": api_key}
        
        # Modify payload to have a small room
        payload = {
            **sample_payload,
            "rooms": [
                {
                    "id": 1,
                    "name": "Small Room",
                    "capacity": 10,  # Too small for group of 25
                    "type": "Lab"
                }
            ],
            "assignments": [
                {
                    "course_id": 1,
                    "instructor_id": 1,
                    "room_id": 1,
                    "group_id": 1,
                    "day": "MONDAY",
                    "start_time": "09:00",
                    "end_time": "10:30"
                }
            ]
        }
        
        response = client.post("/api/v1/validate", json=payload, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["is_valid"] is False
        assert len(data["conflicts"]) > 0
        assert any(c["constraint_type"] == "room_capacity" for c in data["conflicts"])
