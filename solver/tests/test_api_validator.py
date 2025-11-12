"""
Test script for the validation API endpoint.

This script tests the /api/v1/validate endpoint by sending HTTP requests.
"""

import requests
import json
import sys


API_URL = "http://localhost:8001/api/v1/validate"
API_KEY = "development-solver-api-key-change-in-production"


def test_validation_endpoint():
    """Test the validation endpoint with a sample request."""
    
    print("\n" + "="*60)
    print("Testing Validation API Endpoint")
    print("="*60)
    
    # Create test payload
    payload = {
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
    
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
    print("\nSending validation request...")
    print(f"URL: {API_URL}")
    print(f"Assignments to validate: {len(payload['assignments'])}")
    
    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Is Valid: {result['is_valid']}")
            print(f"Conflicts Found: {len(result['conflicts'])}")
            
            if result['conflicts']:
                print("\nConflicts:")
                for conflict in result['conflicts']:
                    print(f"  - [{conflict['severity']}] {conflict['constraint_type']}: {conflict['description']}")
            
            print("\n✓ API endpoint working correctly!")
            return 0
        else:
            print(f"Error: {response.text}")
            return 1
            
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to the API.")
        print("Make sure the solver service is running on http://localhost:8001")
        print("Start it with: cd solver && uvicorn app.main:app --host 0.0.0.0 --port 8001")
        return 1
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return 1


def test_validation_with_conflicts():
    """Test the validation endpoint with conflicting assignments."""
    
    print("\n" + "="*60)
    print("Testing Validation API Endpoint (With Conflicts)")
    print("="*60)
    
    # Create test payload with conflicts
    payload = {
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
                "code": "CS102",
                "title": "Data Structures",
                "duration": 90,
                "department": "Computer Science",
                "room_type": "Lab",
                "instructor_ids": [1],
                "group_ids": [2]
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
                    "TUESDAY": ["08:00-18:00"]
                }
            }
        ],
        "rooms": [
            {
                "id": 1,
                "name": "Lab A",
                "capacity": 30,
                "type": "Lab",
                "equipment": ["Computers"]
            }
        ],
        "groups": [
            {
                "id": 1,
                "name": "CS Year 1",
                "size": 25,
                "course_ids": [1]
            },
            {
                "id": 2,
                "name": "CS Year 2",
                "size": 20,
                "course_ids": [2]
            }
        ],
        "constraints": {
            "hard": {
                "noRoomDoubleBooking": True,
                "noInstructorDoubleBooking": True,
                "roomCapacityCheck": True,
                "roomTypeMatch": True
            },
            "soft": {},
            "working_hours_start": "08:00",
            "working_hours_end": "18:00"
        },
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
                "instructor_id": 1,  # Same instructor - conflict!
                "room_id": 1,  # Same room - conflict!
                "group_id": 2,
                "day": "MONDAY",
                "start_time": "09:30",  # Overlapping time!
                "end_time": "11:00"
            }
        ]
    }
    
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
    print("\nSending validation request with conflicts...")
    print(f"URL: {API_URL}")
    
    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Is Valid: {result['is_valid']}")
            print(f"Conflicts Found: {len(result['conflicts'])}")
            
            if result['conflicts']:
                print("\nConflicts:")
                for conflict in result['conflicts']:
                    print(f"  - [{conflict['severity']}] {conflict['constraint_type']}: {conflict['description']}")
            
            if not result['is_valid'] and len(result['conflicts']) >= 2:
                print("\n✓ API correctly detected conflicts!")
                return 0
            else:
                print("\n✗ Expected conflicts but none found")
                return 1
        else:
            print(f"Error: {response.text}")
            return 1
            
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to the API.")
        print("Make sure the solver service is running on http://localhost:8001")
        return 1
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return 1


def main():
    """Run all API tests."""
    print("\n" + "="*60)
    print("VALIDATION API TEST SUITE")
    print("="*60)
    
    # Test 1: Valid timetable
    result1 = test_validation_endpoint()
    
    # Test 2: Timetable with conflicts
    result2 = test_validation_with_conflicts()
    
    print("\n" + "="*60)
    print("API TEST SUMMARY")
    print("="*60)
    
    if result1 == 0 and result2 == 0:
        print("✓ All API tests passed!")
        return 0
    else:
        print("✗ Some API tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
