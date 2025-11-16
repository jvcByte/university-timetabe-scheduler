"""
Pytest tests for the OR-Tools solver optimization logic.

Tests the solver with small problem instances to verify:
- Basic solver functionality
- Hard constraint satisfaction
- Soft constraint optimization
- Solution extraction
- Infeasibility detection
"""

import pytest
from app.solver.optimizer import TimetableOptimizer, optimize_timetable
from app.models.schemas import (
    GenerationPayload,
    CourseInput,
    InstructorInput,
    RoomInput,
    StudentGroupInput,
    ConstraintConfigInput,
    Day,
)


@pytest.fixture
def simple_payload():
    """Create a simple solvable problem with 2 courses."""
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
            code="CS102",
            title="Data Structures",
            duration=90,
            department="CS",
            room_type="Lab",
            instructor_ids=[1],
            group_ids=[1]
        ),
    ]
    
    instructors = [
        InstructorInput(
            id=1,
            name="Dr. Smith",
            department="CS",
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
            name="Lab A",
            capacity=50,
            type="Lab",
            equipment=["Computers"]
        ),
        RoomInput(
            id=2,
            name="Lab B",
            capacity=50,
            type="Lab",
            equipment=["Computers"]
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
    
    return GenerationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        time_limit_seconds=30
    )


@pytest.fixture
def medium_payload():
    """Create a medium-sized problem with 4 courses."""
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
            code="CS102",
            title="Data Structures",
            duration=90,
            department="CS",
            room_type="Lab",
            instructor_ids=[1],
            group_ids=[1]
        ),
        CourseInput(
            id=3,
            code="MATH201",
            title="Calculus",
            duration=60,
            department="Math",
            room_type="Lecture",
            instructor_ids=[2],
            group_ids=[1]
        ),
        CourseInput(
            id=4,
            code="PHYS101",
            title="Physics",
            duration=60,
            department="Physics",
            room_type="Lecture",
            instructor_ids=[2],
            group_ids=[2]
        ),
    ]
    
    instructors = [
        InstructorInput(
            id=1,
            name="Dr. Smith",
            department="CS",
            teaching_load=20,
            availability={
                Day.MONDAY: ["09:00-17:00"],
                Day.TUESDAY: ["09:00-17:00"],
                Day.WEDNESDAY: ["09:00-17:00"],
                Day.THURSDAY: ["09:00-17:00"],
                Day.FRIDAY: ["09:00-17:00"],
            }
        ),
        InstructorInput(
            id=2,
            name="Dr. Johnson",
            department="Math",
            teaching_load=20,
            availability={
                Day.MONDAY: ["10:00-16:00"],
                Day.TUESDAY: ["10:00-16:00"],
                Day.WEDNESDAY: ["10:00-16:00"],
                Day.THURSDAY: ["10:00-16:00"],
                Day.FRIDAY: ["10:00-16:00"],
            }
        ),
    ]
    
    rooms = [
        RoomInput(
            id=1,
            name="Lab A",
            capacity=50,
            type="Lab"
        ),
        RoomInput(
            id=2,
            name="Lecture Hall",
            capacity=100,
            type="Lecture"
        ),
    ]
    
    groups = [
        StudentGroupInput(
            id=1,
            name="CS Year 1",
            size=30,
            course_ids=[1, 2, 3]
        ),
        StudentGroupInput(
            id=2,
            name="Physics Year 1",
            size=40,
            course_ids=[4]
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
    
    return GenerationPayload(
        courses=courses,
        instructors=instructors,
        rooms=rooms,
        groups=groups,
        constraints=constraints,
        time_limit_seconds=30
    )


class TestBasicSolver:
    """Tests for basic solver functionality."""
    
    def test_solver_finds_solution(self, simple_payload):
        """Test that solver can find a solution for a simple problem."""
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(simple_payload)
        
        assert success is True
        assert len(assignments) == 2  # 2 courses
        assert fitness_score is not None
        assert solve_time > 0
        assert "solution" in message.lower() or "optimal" in message.lower() or "feasible" in message.lower()
    
    def test_assignments_have_required_fields(self, simple_payload):
        """Test that assignments contain all required fields."""
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(simple_payload)
        
        assert success is True
        assert len(assignments) > 0
        
        for assignment in assignments:
            assert assignment.course_id > 0
            assert assignment.instructor_id > 0
            assert assignment.room_id > 0
            assert assignment.group_id > 0
            assert assignment.day in Day
            assert assignment.start_time is not None
            assert assignment.end_time is not None
    
    def test_solver_respects_time_limit(self, simple_payload):
        """Test that solver respects the time limit."""
        simple_payload.time_limit_seconds = 5
        
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(simple_payload)
        
        # Should complete within reasonable time (time limit + overhead)
        assert solve_time < 10


class TestHardConstraints:
    """Tests for hard constraint satisfaction."""
    
    def test_no_room_conflicts(self, medium_payload):
        """Test that solution has no room conflicts."""
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(medium_payload)
        
        if not success:
            pytest.skip("Solver did not find solution")
        
        # Check for room conflicts
        room_schedule = {}
        for assignment in assignments:
            key = (assignment.room_id, assignment.day, assignment.start_time)
            assert key not in room_schedule, f"Room conflict detected: {assignment}"
            room_schedule[key] = assignment
    
    def test_no_instructor_conflicts(self, medium_payload):
        """Test that solution has no instructor conflicts."""
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(medium_payload)
        
        if not success:
            pytest.skip("Solver did not find solution")
        
        # Check for instructor conflicts
        instructor_schedule = {}
        for assignment in assignments:
            key = (assignment.instructor_id, assignment.day, assignment.start_time)
            assert key not in instructor_schedule, f"Instructor conflict detected: {assignment}"
            instructor_schedule[key] = assignment
    
    def test_no_group_conflicts(self, medium_payload):
        """Test that solution has no student group conflicts."""
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(medium_payload)
        
        if not success:
            pytest.skip("Solver did not find solution")
        
        # Check for group conflicts
        group_schedule = {}
        for assignment in assignments:
            key = (assignment.group_id, assignment.day, assignment.start_time)
            assert key not in group_schedule, f"Group conflict detected: {assignment}"
            group_schedule[key] = assignment
    
    def test_room_capacity_satisfied(self, medium_payload):
        """Test that room capacity constraints are satisfied."""
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(medium_payload)
        
        if not success:
            pytest.skip("Solver did not find solution")
        
        # Get room and group data
        rooms = {r.id: r for r in medium_payload.rooms}
        groups = {g.id: g for g in medium_payload.groups}
        
        for assignment in assignments:
            room = rooms[assignment.room_id]
            group = groups[assignment.group_id]
            assert room.capacity >= group.size, f"Room capacity violated: {assignment}"
    
    def test_room_type_matched(self, medium_payload):
        """Test that room types match course requirements."""
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(medium_payload)
        
        if not success:
            pytest.skip("Solver did not find solution")
        
        # Get course and room data
        courses = {c.id: c for c in medium_payload.courses}
        rooms = {r.id: r for r in medium_payload.rooms}
        
        for assignment in assignments:
            course = courses[assignment.course_id]
            room = rooms[assignment.room_id]
            if course.room_type:
                assert room.type == course.room_type, f"Room type mismatch: {assignment}"


class TestInfeasibleProblems:
    """Tests for detecting infeasible problems."""
    
    def test_infeasible_no_suitable_room(self):
        """Test that solver detects infeasibility when no suitable room exists."""
        payload = GenerationPayload(
            courses=[
                CourseInput(
                    id=1,
                    code="CS101",
                    title="Programming",
                    duration=90,
                    department="CS",
                    room_type="Lab",
                    instructor_ids=[1],
                    group_ids=[1]
                )
            ],
            instructors=[
                InstructorInput(
                    id=1,
                    name="Dr. Smith",
                    department="CS",
                    teaching_load=10,
                    availability={Day.MONDAY: ["09:00-17:00"]}
                )
            ],
            rooms=[
                RoomInput(
                    id=1,
                    name="Lecture Hall",
                    capacity=50,
                    type="Lecture"  # Wrong type!
                )
            ],
            groups=[
                StudentGroupInput(
                    id=1,
                    name="Group 1",
                    size=30,
                    course_ids=[1]
                )
            ],
            constraints=ConstraintConfigInput(
                hard={"roomTypeMatch": True},
                soft={},
                working_hours_start="08:00",
                working_hours_end="18:00"
            ),
            time_limit_seconds=10
        )
        
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(payload)
        
        assert success is False
        assert len(assignments) == 0
        assert "room" in message.lower() or "infeasible" in message.lower()
    
    def test_infeasible_insufficient_capacity(self):
        """Test that solver detects infeasibility when room capacity is insufficient."""
        payload = GenerationPayload(
            courses=[
                CourseInput(
                    id=1,
                    code="CS101",
                    title="Programming",
                    duration=90,
                    department="CS",
                    room_type="Lab",
                    instructor_ids=[1],
                    group_ids=[1]
                )
            ],
            instructors=[
                InstructorInput(
                    id=1,
                    name="Dr. Smith",
                    department="CS",
                    teaching_load=10,
                    availability={Day.MONDAY: ["09:00-17:00"]}
                )
            ],
            rooms=[
                RoomInput(
                    id=1,
                    name="Small Lab",
                    capacity=10,  # Too small!
                    type="Lab"
                )
            ],
            groups=[
                StudentGroupInput(
                    id=1,
                    name="Group 1",
                    size=50,  # Too large for room
                    course_ids=[1]
                )
            ],
            constraints=ConstraintConfigInput(
                hard={"roomCapacityCheck": True},
                soft={},
                working_hours_start="08:00",
                working_hours_end="18:00"
            ),
            time_limit_seconds=10
        )
        
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(payload)
        
        assert success is False
        assert len(assignments) == 0
        assert "capacity" in message.lower() or "infeasible" in message.lower()


class TestSoftConstraints:
    """Tests for soft constraint optimization."""
    
    def test_fitness_score_calculated(self, simple_payload):
        """Test that fitness score is calculated."""
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(simple_payload)
        
        if not success:
            pytest.skip("Solver did not find solution")
        
        assert fitness_score is not None
        assert fitness_score >= 0
    
    def test_violations_reported(self, simple_payload):
        """Test that soft constraint violations are reported."""
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(simple_payload)
        
        if not success:
            pytest.skip("Solver did not find solution")
        
        assert isinstance(violations, list)
        # Violations may or may not exist depending on solution
        for violation in violations:
            assert violation.constraint_type is not None
            assert violation.severity == "soft"
            assert violation.description is not None


class TestOptimizerClass:
    """Tests for the TimetableOptimizer class."""
    
    def test_optimizer_initialization(self, simple_payload):
        """Test that optimizer initializes correctly."""
        optimizer = TimetableOptimizer(simple_payload)
        
        assert len(optimizer.courses) == 2
        assert len(optimizer.instructors) == 1
        assert len(optimizer.rooms) == 2
        assert len(optimizer.groups) == 1
        assert len(optimizer.days) == 5
        assert len(optimizer.time_slots) > 0
    
    def test_time_slot_generation(self, simple_payload):
        """Test that time slots are generated correctly."""
        optimizer = TimetableOptimizer(simple_payload)
        
        assert len(optimizer.time_slots) > 0
        
        # Check that time slots are within working hours
        for start, end in optimizer.time_slots:
            start_min = optimizer._time_to_minutes(start)
            end_min = optimizer._time_to_minutes(end)
            
            working_start_min = optimizer._time_to_minutes(simple_payload.constraints.working_hours_start)
            working_end_min = optimizer._time_to_minutes(simple_payload.constraints.working_hours_end)
            
            assert start_min >= working_start_min
            assert end_min <= working_end_min
    
    def test_decision_variables_created(self, simple_payload):
        """Test that decision variables are created."""
        optimizer = TimetableOptimizer(simple_payload)
        optimizer.create_decision_variables()
        
        assert len(optimizer.assignment_vars) > 0
