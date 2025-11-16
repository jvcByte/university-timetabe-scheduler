"""
Pytest tests for constraint validation logic.

Tests the validator module to ensure all hard constraints are properly checked:
- Room conflicts
- Instructor conflicts
- Student group conflicts
- Room capacity constraints
- Room type constraints
- Instructor availability
- Working hours
"""

import pytest
from app.solver.validator import TimetableValidator, validate_timetable
from app.models.schemas import (
    GenerationPayload,
    CourseInput,
    InstructorInput,
    RoomInput,
    StudentGroupInput,
    ConstraintConfigInput,
    AssignmentOutput,
    Day,
)


@pytest.fixture
def base_payload():
    """Create a base payload with test data."""
    courses = [
        CourseInput(
            id=1,
            code="CS101",
            title="Programming",
            duration=90,
            department="CS",
            room_type="Lab",
            instructor_ids=[1],
            group_ids=[1]
        ),
        CourseInput(
            id=2,
            code="MATH201",
            title="Calculus",
            duration=60,
            department="Math",
            room_type="Lecture",
            instructor_ids=[2],
            group_ids=[1]
        ),
        CourseInput(
            id=3,
            code="CS102",
            title="Data Structures",
            duration=90,
            department="CS",
            room_type="Lab",
            instructor_ids=[1],
            group_ids=[2]
        ),
    ]
    
    instructors = [
        InstructorInput(
            id=1,
            name="Dr. Smith",
            department="CS",
            teaching_load=10,
            availability={
                Day.MONDAY: ["08:00-18:00"],
                Day.TUESDAY: ["08:00-18:00"],
                Day.WEDNESDAY: ["08:00-18:00"],
                Day.THURSDAY: ["08:00-18:00"],
                Day.FRIDAY: ["08:00-18:00"],
            }
        ),
        InstructorInput(
            id=2,
            name="Dr. Johnson",
            department="Math",
            teaching_load=10,
            availability={
                Day.MONDAY: ["09:00-17:00"],
                Day.TUESDAY: ["09:00-17:00"],
                Day.WEDNESDAY: ["09:00-17:00"],
                Day.THURSDAY: ["09:00-17:00"],
                Day.FRIDAY: ["09:00-17:00"],
            }
        ),
    ]
    
    rooms = [
        RoomInput(
            id=1,
            name="Lab A",
            capacity=30,
            type="Lab",
            equipment=["Computers"]
        ),
        RoomInput(
            id=2,
            name="Lecture Hall B",
            capacity=50,
            type="Lecture",
            equipment=["Projector"]
        ),
        RoomInput(
            id=3,
            name="Small Lab C",
            capacity=15,
            type="Lab",
            equipment=["Computers"]
        ),
    ]
    
    groups = [
        StudentGroupInput(
            id=1,
            name="CS Year 1",
            size=25,
            course_ids=[1, 2]
        ),
        StudentGroupInput(
            id=2,
            name="CS Year 2",
            size=20,
            course_ids=[3]
        ),
    ]
    
    constraints = ConstraintConfigInput(
        hard={
            "noRoomDoubleBooking": True,
            "noInstructorDoubleBooking": True,
            "roomCapacityCheck": True,
            "roomTypeMatch": True,
        },
        soft={},
        working_hours_start="08:00",
        working_hours_end="18:00"
    )
    
    return GenerationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        time_limit_seconds=30
    )


class TestValidTimetable:
    """Tests for valid timetables with no conflicts."""
    
    def test_valid_timetable_no_conflicts(self, base_payload):
        """Test that a valid timetable passes validation."""
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=1,
                group_id=1,
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"
            ),
            AssignmentOutput(
                course_id=2,
                instructor_id=2,
                room_id=2,
                group_id=1,
                day=Day.MONDAY,
                start_time="11:00",
                end_time="12:00"
            ),
            AssignmentOutput(
                course_id=3,
                instructor_id=1,
                room_id=1,
                group_id=2,
                day=Day.TUESDAY,
                start_time="09:00",
                end_time="10:30"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is True
        assert len(conflicts) == 0


class TestRoomConflicts:
    """Tests for room double-booking detection."""
    
    def test_room_conflict_overlapping_times(self, base_payload):
        """Test detection of room conflicts with overlapping times."""
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=1,
                group_id=1,
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"
            ),
            AssignmentOutput(
                course_id=3,
                instructor_id=1,
                room_id=1,  # Same room
                group_id=2,
                day=Day.MONDAY,
                start_time="09:30",  # Overlaps
                end_time="11:00"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is False
        assert len(conflicts) > 0
        assert any(c.constraint_type == "room_conflict" for c in conflicts)
    
    def test_room_no_conflict_different_times(self, base_payload):
        """Test that same room at different times is valid."""
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=1,
                group_id=1,
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"
            ),
            AssignmentOutput(
                course_id=3,
                instructor_id=1,
                room_id=1,  # Same room
                group_id=2,
                day=Day.MONDAY,
                start_time="11:00",  # No overlap
                end_time="12:30"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is True
        assert len(conflicts) == 0


class TestInstructorConflicts:
    """Tests for instructor double-booking detection."""
    
    def test_instructor_conflict_overlapping_times(self, base_payload):
        """Test detection of instructor conflicts."""
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=1,
                group_id=1,
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"
            ),
            AssignmentOutput(
                course_id=3,
                instructor_id=1,  # Same instructor
                room_id=3,
                group_id=2,
                day=Day.MONDAY,
                start_time="10:00",  # Overlaps
                end_time="11:30"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is False
        assert len(conflicts) > 0
        assert any(c.constraint_type == "instructor_conflict" for c in conflicts)
    
    def test_instructor_no_conflict_different_days(self, base_payload):
        """Test that same instructor on different days is valid."""
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=1,
                group_id=1,
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"
            ),
            AssignmentOutput(
                course_id=3,
                instructor_id=1,  # Same instructor
                room_id=1,
                group_id=2,
                day=Day.TUESDAY,  # Different day
                start_time="09:00",
                end_time="10:30"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is True
        assert len(conflicts) == 0


class TestGroupConflicts:
    """Tests for student group double-booking detection."""
    
    def test_group_conflict_overlapping_times(self, base_payload):
        """Test detection of student group conflicts."""
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=1,
                group_id=1,
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"
            ),
            AssignmentOutput(
                course_id=2,
                instructor_id=2,
                room_id=2,
                group_id=1,  # Same group
                day=Day.MONDAY,
                start_time="10:00",  # Overlaps
                end_time="11:00"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is False
        assert len(conflicts) > 0
        assert any(c.constraint_type == "group_conflict" for c in conflicts)


class TestRoomCapacity:
    """Tests for room capacity constraint checking."""
    
    def test_room_capacity_violation(self, base_payload):
        """Test detection of room capacity violations."""
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=3,  # Small Lab C with capacity 15
                group_id=1,  # Group with 25 students
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is False
        assert len(conflicts) > 0
        assert any(c.constraint_type == "room_capacity" for c in conflicts)
    
    def test_room_capacity_sufficient(self, base_payload):
        """Test that sufficient room capacity passes validation."""
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=1,  # Lab A with capacity 30
                group_id=1,  # Group with 25 students
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is True
        assert len(conflicts) == 0


class TestRoomType:
    """Tests for room type constraint checking."""
    
    def test_room_type_mismatch(self, base_payload):
        """Test detection of room type mismatches."""
        assignments = [
            AssignmentOutput(
                course_id=1,  # CS101 requires Lab
                instructor_id=1,
                room_id=2,  # Lecture Hall B (not a Lab)
                group_id=1,
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is False
        assert len(conflicts) > 0
        assert any(c.constraint_type == "room_type" for c in conflicts)
    
    def test_room_type_match(self, base_payload):
        """Test that matching room type passes validation."""
        assignments = [
            AssignmentOutput(
                course_id=1,  # CS101 requires Lab
                instructor_id=1,
                room_id=1,  # Lab A
                group_id=1,
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is True
        assert len(conflicts) == 0


class TestInstructorAvailability:
    """Tests for instructor availability constraint checking."""
    
    def test_instructor_unavailable_day(self, base_payload):
        """Test detection when instructor is not available on a day."""
        # Modify instructor to not be available on Saturday
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=1,
                group_id=1,
                day=Day.SATURDAY,  # Not in availability
                start_time="09:00",
                end_time="10:30"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is False
        assert len(conflicts) > 0
        assert any(c.constraint_type == "instructor_availability" for c in conflicts)
    
    def test_instructor_unavailable_time(self, base_payload):
        """Test detection when instructor is not available at a time."""
        assignments = [
            AssignmentOutput(
                course_id=2,
                instructor_id=2,  # Dr. Johnson available 09:00-17:00
                room_id=2,
                group_id=1,
                day=Day.MONDAY,
                start_time="08:00",  # Before availability
                end_time="09:00"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is False
        assert len(conflicts) > 0
        assert any(c.constraint_type == "instructor_availability" for c in conflicts)
    
    def test_instructor_available(self, base_payload):
        """Test that assignment within availability passes."""
        assignments = [
            AssignmentOutput(
                course_id=2,
                instructor_id=2,  # Dr. Johnson available 09:00-17:00
                room_id=2,
                group_id=1,
                day=Day.MONDAY,
                start_time="10:00",  # Within availability
                end_time="11:00"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is True
        assert len(conflicts) == 0


class TestWorkingHours:
    """Tests for working hours constraint checking."""
    
    def test_assignment_outside_working_hours(self, base_payload):
        """Test detection of assignments outside working hours."""
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=1,
                group_id=1,
                day=Day.MONDAY,
                start_time="17:30",
                end_time="19:00"  # Ends after 18:00
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is False
        assert len(conflicts) > 0
        assert any(c.constraint_type == "working_hours" for c in conflicts)
    
    def test_assignment_within_working_hours(self, base_payload):
        """Test that assignment within working hours passes."""
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=1,
                group_id=1,
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"  # Within 08:00-18:00
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is True
        assert len(conflicts) == 0


class TestMultipleViolations:
    """Tests for detecting multiple simultaneous violations."""
    
    def test_multiple_violations_detected(self, base_payload):
        """Test that multiple violations are all detected."""
        assignments = [
            AssignmentOutput(
                course_id=1,
                instructor_id=1,
                room_id=2,  # Wrong room type (Lecture instead of Lab)
                group_id=1,
                day=Day.MONDAY,
                start_time="09:00",
                end_time="10:30"
            ),
            AssignmentOutput(
                course_id=3,
                instructor_id=1,  # Same instructor - conflict
                room_id=3,  # Too small - capacity violation
                group_id=2,
                day=Day.MONDAY,
                start_time="09:30",  # Overlapping - instructor conflict
                end_time="11:00"
            ),
        ]
        
        is_valid, conflicts = validate_timetable(base_payload, assignments)
        
        assert is_valid is False
        assert len(conflicts) >= 2
        
        # Should detect room type, instructor conflict, and capacity violations
        conflict_types = {c.constraint_type for c in conflicts}
        assert "room_type" in conflict_types
        assert "instructor_conflict" in conflict_types
        assert "room_capacity" in conflict_types
