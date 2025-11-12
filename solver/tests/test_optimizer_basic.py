"""
Basic test to verify the OR-Tools solver implementation.
"""

from app.models.schemas import (
    GenerationPayload,
    CourseInput,
    InstructorInput,
    RoomInput,
    StudentGroupInput,
    ConstraintConfigInput,
    Day,
)
from app.solver.optimizer import optimize_timetable


def test_basic_solver():
    """Test solver with a minimal problem instance."""
    
    # Create a simple test case: 2 courses, 1 instructor, 2 rooms, 1 group
    courses = [
        CourseInput(
            id=1,
            code="CS101",
            title="Introduction to Programming",
            duration=90,
            department="Computer Science",
            room_type="LECTURE_HALL",
            instructor_ids=[1],
            group_ids=[1]
        ),
        CourseInput(
            id=2,
            code="CS102",
            title="Data Structures",
            duration=90,
            department="Computer Science",
            room_type="LECTURE_HALL",
            instructor_ids=[1],
            group_ids=[1]
        ),
    ]
    
    instructors = [
        InstructorInput(
            id=1,
            name="Dr. Smith",
            department="Computer Science",
            teaching_load=20,
            availability={
                Day.MONDAY: ["09:00-17:00"],
                Day.TUESDAY: ["09:00-17:00"],
                Day.WEDNESDAY: ["09:00-17:00"],
                Day.THURSDAY: ["09:00-17:00"],
                Day.FRIDAY: ["09:00-17:00"],
            },
            preferences={
                "preferredDays": ["MONDAY", "WEDNESDAY"],
                "preferredTimes": ["09:00-12:00"]
            }
        ),
    ]
    
    rooms = [
        RoomInput(
            id=1,
            name="Room A101",
            capacity=50,
            type="LECTURE_HALL",
            equipment=["PROJECTOR", "WHITEBOARD"]
        ),
        RoomInput(
            id=2,
            name="Room A102",
            capacity=50,
            type="LECTURE_HALL",
            equipment=["PROJECTOR"]
        ),
    ]
    
    groups = [
        StudentGroupInput(
            id=1,
            name="CS Year 1",
            size=30,
            course_ids=[1, 2]
        ),
    ]
    
    constraints = ConstraintConfigInput(
        hard={
            "noRoomDoubleBooking": True,
            "noInstructorDoubleBooking": True,
            "roomCapacityCheck": True,
            "roomTypeMatch": True,
            "workingHoursOnly": True,
        },
        soft={
            "instructorPreferencesWeight": 5,
            "compactSchedulesWeight": 7,
            "balancedDailyLoadWeight": 6,
            "preferredRoomsWeight": 3,
        },
        working_hours_start="09:00",
        working_hours_end="17:00"
    )
    
    payload = GenerationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        time_limit_seconds=30
    )
    
    # Run optimization
    print("Running optimization...")
    success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(payload)
    
    print(f"\nResults:")
    print(f"  Success: {success}")
    print(f"  Message: {message}")
    print(f"  Solve time: {solve_time:.2f}s")
    print(f"  Assignments: {len(assignments)}")
    print(f"  Fitness score: {fitness_score}")
    print(f"  Violations: {len(violations)}")
    
    if assignments:
        print(f"\nAssignments:")
        for assignment in assignments:
            print(f"  - Course {assignment.course_id}: {assignment.day.value} {assignment.start_time}-{assignment.end_time} in Room {assignment.room_id}")
    
    if violations:
        print(f"\nViolations:")
        for violation in violations[:5]:  # Show first 5
            print(f"  - {violation.constraint_type}: {violation.description}")
    
    # Basic assertions
    assert success, f"Optimization should succeed but got: {message}"
    assert len(assignments) == 2, f"Expected 2 assignments, got {len(assignments)}"
    assert fitness_score is not None, "Fitness score should be calculated"
    
    print("\n✓ Basic solver test passed!")


if __name__ == "__main__":
    test_basic_solver()
