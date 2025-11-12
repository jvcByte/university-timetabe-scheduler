from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from enum import Enum


class Day(str, Enum):
    """Days of the week."""
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    SUNDAY = "SUNDAY"


class CourseInput(BaseModel):
    """Course input model."""
    id: int
    code: str
    title: str
    duration: int
    department: str
    room_type: Optional[str] = None
    instructor_ids: List[int]
    group_ids: List[int]


class InstructorInput(BaseModel):
    """Instructor input model."""
    id: int
    name: str
    department: str
    teaching_load: int
    availability: Dict[Day, List[str]]
    preferences: Optional[Dict] = None


class RoomInput(BaseModel):
    """Room input model."""
    id: int
    name: str
    capacity: int
    type: str
    equipment: Optional[List[str]] = None


class StudentGroupInput(BaseModel):
    """Student group input model."""
    id: int
    name: str
    size: int
    course_ids: List[int]


class ConstraintConfigInput(BaseModel):
    """Constraint configuration input model."""
    hard: Dict[str, bool]
    soft: Dict[str, int]
    working_hours_start: str = "08:00"
    working_hours_end: str = "18:00"


class GenerationPayload(BaseModel):
    """Timetable generation request payload."""
    courses: List[CourseInput]
    instructors: List[InstructorInput]
    rooms: List[RoomInput]
    groups: List[StudentGroupInput]
    constraints: ConstraintConfigInput
    time_limit_seconds: int = Field(default=300, ge=10, le=600)


class AssignmentOutput(BaseModel):
    """Assignment output model."""
    course_id: int
    instructor_id: int
    room_id: int
    group_id: int
    day: Day
    start_time: str
    end_time: str


class ViolationDetail(BaseModel):
    """Constraint violation detail."""
    constraint_type: str
    severity: str
    description: str
    affected_assignments: List[int] = []


class TimetableResult(BaseModel):
    """Timetable generation result."""
    success: bool
    assignments: List[AssignmentOutput] = []
    fitness_score: Optional[float] = None
    violations: List[ViolationDetail] = []
    solve_time_seconds: float
    message: str


class ValidationResult(BaseModel):
    """Timetable validation result."""
    is_valid: bool
    conflicts: List[ViolationDetail]
