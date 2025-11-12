"""
Test script for the timetable validator.

This script tests all validation functions with various scenarios including
valid timetables and timetables with different types of conflicts.
"""

import sys
from app.models.schemas import (
    CourseInput,
    InstructorInput,
    RoomInput,
    StudentGroupInput,
    ConstraintConfigInput,
    ValidationPayload,
    AssignmentOutput,
    Day,
)
from app.solver.validator import validate_timetable


def create_test_data():
    """Create test data for validation."""
    
    # Create courses
    courses = [
        CourseInput(
            id=1,
            code="CS101",
            title="Introduction to Programming",
            duration=90,
            department="Computer Science",
            room_type="Lab",
            instructor_ids=[1],
            group_ids=[1]
        ),
        CourseInput(
            id=2,
            code="MATH201",
            title="Calculus I",
            duration=60,
            department="Mathematics",
            room_type="Lecture",
            instructor_ids=[2],
            group_ids=[1]
        ),
        CourseInput(
            id=3,
            code="CS102",
            title="Data Structures",
            duration=90,
            department="Computer Science",
            room_type="Lab",
            instructor_ids=[1],
            group_ids=[2]
        ),
    ]
    
    # Create instructors
    instructors = [
        InstructorInput(
            id=1,
            name="Dr. Smith",
            department="Computer Science",
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
            department="Mathematics",
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
    
    # Create rooms
    rooms = [
        RoomInput(
            id=1,
            name="Lab A",
            capacity=30,
            type="Lab",
            equipment=["Computers", "Projector"]
        ),
        RoomInput(
            id=2,
            name="Lecture Hall B",
            capacity=50,
            type="Lecture",
            equipment=["Projector", "Whiteboard"]
        ),
        RoomInput(
            id=3,
            name="Small Lab C",
            capacity=15,
            type="Lab",
            equipment=["Computers"]
        ),
    ]
    
    # Create student groups
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
    
    # Create constraints
    constraints = ConstraintConfigInput(
        hard={
            "noRoomDoubleBooking": True,
            "noInstructorDoubleBooking": True,
            "roomCapacityCheck": True,
            "roomTypeMatch": True,
        },
        soft={
            "instructorPreferencesWeight": 5,
            "compactSchedulesWeight": 7,
            "balancedDailyLoadWeight": 6,
            "preferredRoomsWeight": 3,
        },
        working_hours_start="08:00",
        working_hours_end="18:00"
    )
    
    return courses, instructors, rooms, groups, constraints


def test_valid_timetable():
    """Test a valid timetable with no conflicts."""
    print("\n" + "="*60)
    print("TEST 1: Valid Timetable (No Conflicts)")
    print("="*60)
    
    courses, instructors, rooms, groups, constraints = create_test_data()
    
    # Create valid assignments
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
    
    payload = ValidationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        assignments=assignments
    )
    
    is_valid, conflicts = validate_timetable(payload, assignments)
    
    print(f"Result: {'✓ VALID' if is_valid else '✗ INVALID'}")
    print(f"Conflicts found: {len(conflicts)}")
    
    if conflicts:
        print("\nConflicts:")
        for conflict in conflicts:
            print(f"  - [{conflict.severity}] {conflict.constraint_type}: {conflict.description}")
    
    assert is_valid, "Expected valid timetable but found conflicts"
    print("\n✓ Test passed!")


def test_room_conflict():
    """Test detection of room double-booking."""
    print("\n" + "="*60)
    print("TEST 2: Room Conflict Detection")
    print("="*60)
    
    courses, instructors, rooms, groups, constraints = create_test_data()
    
    # Create assignments with room conflict
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
            room_id=1,  # Same room!
            group_id=2,
            day=Day.MONDAY,
            start_time="09:30",  # Overlapping time!
            end_time="11:00"
        ),
    ]
    
    payload = ValidationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        assignments=assignments
    )
    
    is_valid, conflicts = validate_timetable(payload, assignments)
    
    print(f"Result: {'✓ VALID' if is_valid else '✗ INVALID'}")
    print(f"Conflicts found: {len(conflicts)}")
    
    if conflicts:
        print("\nConflicts:")
        for conflict in conflicts:
            print(f"  - [{conflict.severity}] {conflict.constraint_type}: {conflict.description}")
    
    assert not is_valid, "Expected invalid timetable due to room conflict"
    assert any(c.constraint_type == "room_conflict" for c in conflicts), "Expected room_conflict"
    print("\n✓ Test passed!")


def test_instructor_conflict():
    """Test detection of instructor double-booking."""
    print("\n" + "="*60)
    print("TEST 3: Instructor Conflict Detection")
    print("="*60)
    
    courses, instructors, rooms, groups, constraints = create_test_data()
    
    # Create assignments with instructor conflict
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
            instructor_id=1,  # Same instructor!
            room_id=3,
            group_id=2,
            day=Day.MONDAY,
            start_time="10:00",  # Overlapping time!
            end_time="11:30"
        ),
    ]
    
    payload = ValidationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        assignments=assignments
    )
    
    is_valid, conflicts = validate_timetable(payload, assignments)
    
    print(f"Result: {'✓ VALID' if is_valid else '✗ INVALID'}")
    print(f"Conflicts found: {len(conflicts)}")
    
    if conflicts:
        print("\nConflicts:")
        for conflict in conflicts:
            print(f"  - [{conflict.severity}] {conflict.constraint_type}: {conflict.description}")
    
    assert not is_valid, "Expected invalid timetable due to instructor conflict"
    assert any(c.constraint_type == "instructor_conflict" for c in conflicts), "Expected instructor_conflict"
    print("\n✓ Test passed!")


def test_group_conflict():
    """Test detection of student group double-booking."""
    print("\n" + "="*60)
    print("TEST 4: Student Group Conflict Detection")
    print("="*60)
    
    courses, instructors, rooms, groups, constraints = create_test_data()
    
    # Create assignments with group conflict
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
            group_id=1,  # Same group!
            day=Day.MONDAY,
            start_time="10:00",  # Overlapping time!
            end_time="11:00"
        ),
    ]
    
    payload = ValidationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        assignments=assignments
    )
    
    is_valid, conflicts = validate_timetable(payload, assignments)
    
    print(f"Result: {'✓ VALID' if is_valid else '✗ INVALID'}")
    print(f"Conflicts found: {len(conflicts)}")
    
    if conflicts:
        print("\nConflicts:")
        for conflict in conflicts:
            print(f"  - [{conflict.severity}] {conflict.constraint_type}: {conflict.description}")
    
    assert not is_valid, "Expected invalid timetable due to group conflict"
    assert any(c.constraint_type == "group_conflict" for c in conflicts), "Expected group_conflict"
    print("\n✓ Test passed!")


def test_room_capacity_violation():
    """Test detection of room capacity violations."""
    print("\n" + "="*60)
    print("TEST 5: Room Capacity Violation Detection")
    print("="*60)
    
    courses, instructors, rooms, groups, constraints = create_test_data()
    
    # Create assignment with room too small for group
    assignments = [
        AssignmentOutput(
            course_id=1,
            instructor_id=1,
            room_id=3,  # Small Lab C with capacity 15, but group has 25 students
            group_id=1,
            day=Day.MONDAY,
            start_time="09:00",
            end_time="10:30"
        ),
    ]
    
    payload = ValidationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        assignments=assignments
    )
    
    is_valid, conflicts = validate_timetable(payload, assignments)
    
    print(f"Result: {'✓ VALID' if is_valid else '✗ INVALID'}")
    print(f"Conflicts found: {len(conflicts)}")
    
    if conflicts:
        print("\nConflicts:")
        for conflict in conflicts:
            print(f"  - [{conflict.severity}] {conflict.constraint_type}: {conflict.description}")
    
    assert not is_valid, "Expected invalid timetable due to room capacity"
    assert any(c.constraint_type == "room_capacity" for c in conflicts), "Expected room_capacity violation"
    print("\n✓ Test passed!")


def test_room_type_violation():
    """Test detection of room type mismatches."""
    print("\n" + "="*60)
    print("TEST 6: Room Type Violation Detection")
    print("="*60)
    
    courses, instructors, rooms, groups, constraints = create_test_data()
    
    # Create assignment with wrong room type
    assignments = [
        AssignmentOutput(
            course_id=1,  # CS101 requires Lab
            instructor_id=1,
            room_id=2,  # Lecture Hall B (not a Lab!)
            group_id=1,
            day=Day.MONDAY,
            start_time="09:00",
            end_time="10:30"
        ),
    ]
    
    payload = ValidationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        assignments=assignments
    )
    
    is_valid, conflicts = validate_timetable(payload, assignments)
    
    print(f"Result: {'✓ VALID' if is_valid else '✗ INVALID'}")
    print(f"Conflicts found: {len(conflicts)}")
    
    if conflicts:
        print("\nConflicts:")
        for conflict in conflicts:
            print(f"  - [{conflict.severity}] {conflict.constraint_type}: {conflict.description}")
    
    assert not is_valid, "Expected invalid timetable due to room type mismatch"
    assert any(c.constraint_type == "room_type" for c in conflicts), "Expected room_type violation"
    print("\n✓ Test passed!")


def test_instructor_availability_violation():
    """Test detection of instructor availability violations."""
    print("\n" + "="*60)
    print("TEST 7: Instructor Availability Violation Detection")
    print("="*60)
    
    courses, instructors, rooms, groups, constraints = create_test_data()
    
    # Create assignment outside instructor's available time
    assignments = [
        AssignmentOutput(
            course_id=2,
            instructor_id=2,  # Dr. Johnson available 09:00-17:00
            room_id=2,
            group_id=1,
            day=Day.MONDAY,
            start_time="08:00",  # Before availability!
            end_time="09:00"
        ),
    ]
    
    payload = ValidationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        assignments=assignments
    )
    
    is_valid, conflicts = validate_timetable(payload, assignments)
    
    print(f"Result: {'✓ VALID' if is_valid else '✗ INVALID'}")
    print(f"Conflicts found: {len(conflicts)}")
    
    if conflicts:
        print("\nConflicts:")
        for conflict in conflicts:
            print(f"  - [{conflict.severity}] {conflict.constraint_type}: {conflict.description}")
    
    assert not is_valid, "Expected invalid timetable due to instructor availability"
    assert any(c.constraint_type == "instructor_availability" for c in conflicts), "Expected instructor_availability violation"
    print("\n✓ Test passed!")


def test_working_hours_violation():
    """Test detection of working hours violations."""
    print("\n" + "="*60)
    print("TEST 8: Working Hours Violation Detection")
    print("="*60)
    
    courses, instructors, rooms, groups, constraints = create_test_data()
    
    # Create assignment outside working hours
    assignments = [
        AssignmentOutput(
            course_id=1,
            instructor_id=1,
            room_id=1,
            group_id=1,
            day=Day.MONDAY,
            start_time="17:30",
            end_time="19:00"  # Ends after 18:00!
        ),
    ]
    
    payload = ValidationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        assignments=assignments
    )
    
    is_valid, conflicts = validate_timetable(payload, assignments)
    
    print(f"Result: {'✓ VALID' if is_valid else '✗ INVALID'}")
    print(f"Conflicts found: {len(conflicts)}")
    
    if conflicts:
        print("\nConflicts:")
        for conflict in conflicts:
            print(f"  - [{conflict.severity}] {conflict.constraint_type}: {conflict.description}")
    
    assert not is_valid, "Expected invalid timetable due to working hours"
    assert any(c.constraint_type == "working_hours" for c in conflicts), "Expected working_hours violation"
    print("\n✓ Test passed!")


def test_multiple_violations():
    """Test detection of multiple simultaneous violations."""
    print("\n" + "="*60)
    print("TEST 9: Multiple Violations Detection")
    print("="*60)
    
    courses, instructors, rooms, groups, constraints = create_test_data()
    
    # Create assignments with multiple violations
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
            instructor_id=1,  # Same instructor - conflict!
            room_id=3,  # Too small - capacity violation!
            group_id=2,
            day=Day.MONDAY,
            start_time="09:30",  # Overlapping - instructor conflict!
            end_time="11:00"
        ),
    ]
    
    payload = ValidationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        assignments=assignments
    )
    
    is_valid, conflicts = validate_timetable(payload, assignments)
    
    print(f"Result: {'✓ VALID' if is_valid else '✗ INVALID'}")
    print(f"Conflicts found: {len(conflicts)}")
    
    if conflicts:
        print("\nConflicts:")
        for conflict in conflicts:
            print(f"  - [{conflict.severity}] {conflict.constraint_type}: {conflict.description}")
    
    assert not is_valid, "Expected invalid timetable due to multiple violations"
    assert len(conflicts) >= 2, f"Expected at least 2 violations, found {len(conflicts)}"
    print("\n✓ Test passed!")


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("TIMETABLE VALIDATOR TEST SUITE")
    print("="*60)
    
    tests = [
        test_valid_timetable,
        test_room_conflict,
        test_instructor_conflict,
        test_group_conflict,
        test_room_capacity_violation,
        test_room_type_violation,
        test_instructor_availability_violation,
        test_working_hours_violation,
        test_multiple_violations,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"\n✗ Test failed: {e}")
            failed += 1
        except Exception as e:
            print(f"\n✗ Test error: {e}")
            failed += 1
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Total tests: {len(tests)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n✓ All tests passed!")
        return 0
    else:
        print(f"\n✗ {failed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
