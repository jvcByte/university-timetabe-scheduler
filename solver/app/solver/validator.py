"""
Timetable validation module for checking constraint violations.

This module provides functions to validate timetables against hard constraints
and identify conflicts without running the full optimization process.
"""

import logging
from typing import List, Dict, Tuple, Set
from ..models.schemas import (
    GenerationPayload,
    AssignmentOutput,
    ViolationDetail,
    Day,
    CourseInput,
    InstructorInput,
    RoomInput,
    StudentGroupInput,
)

logger = logging.getLogger(__name__)


class TimetableValidator:
    """
    Validator for checking timetable constraint violations.
    
    This class checks all hard constraints and reports conflicts found
    in a given timetable without performing optimization.
    """
    
    def __init__(self, payload: GenerationPayload):
        """
        Initialize the validator with input data.
        
        Args:
            payload: Validation request containing courses, instructors, rooms, groups, constraints, and assignments
        """
        self.payload = payload
        
        # Parse input data into internal structures
        self.courses = {c.id: c for c in payload.courses}
        self.instructors = {i.id: i for i in payload.instructors}
        self.rooms = {r.id: r for r in payload.rooms}
        self.groups = {g.id: g for g in payload.groups}
        
        # Extract assignments from payload (if they exist)
        # For validation, we expect assignments to be passed in the payload
        self.assignments: List[AssignmentOutput] = []
        
        logger.info(
            f"Initialized validator: {len(self.courses)} courses, "
            f"{len(self.instructors)} instructors, "
            f"{len(self.rooms)} rooms, "
            f"{len(self.groups)} groups"
        )
    
    def set_assignments(self, assignments: List[AssignmentOutput]):
        """
        Set the assignments to validate.
        
        Args:
            assignments: List of assignments to check for conflicts
        """
        self.assignments = assignments
        logger.info(f"Set {len(assignments)} assignments for validation")
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert time string (HH:MM) to minutes since midnight."""
        hour, minute = map(int, time_str.split(':'))
        return hour * 60 + minute
    
    def _times_overlap(self, start1: str, end1: str, start2: str, end2: str) -> bool:
        """
        Check if two time ranges overlap.
        
        Args:
            start1: Start time of first range (HH:MM)
            end1: End time of first range (HH:MM)
            start2: Start time of second range (HH:MM)
            end2: End time of second range (HH:MM)
            
        Returns:
            True if ranges overlap, False otherwise
        """
        start1_min = self._time_to_minutes(start1)
        end1_min = self._time_to_minutes(end1)
        start2_min = self._time_to_minutes(start2)
        end2_min = self._time_to_minutes(end2)
        
        # Two ranges overlap if one starts before the other ends
        return start1_min < end2_min and start2_min < end1_min
    
    def validate_all(self) -> Tuple[bool, List[ViolationDetail]]:
        """
        Run all validation checks and return results.
        
        Returns:
            Tuple of (is_valid, conflicts) where is_valid is True if no hard constraint violations found
        """
        logger.info("Starting validation...")
        
        conflicts = []
        
        # Run all hard constraint checks
        conflicts.extend(self.check_room_conflicts())
        conflicts.extend(self.check_instructor_conflicts())
        conflicts.extend(self.check_group_conflicts())
        conflicts.extend(self.check_room_capacity_constraints())
        conflicts.extend(self.check_room_type_constraints())
        conflicts.extend(self.check_instructor_availability())
        conflicts.extend(self.check_working_hours())
        
        is_valid = len(conflicts) == 0
        
        logger.info(f"Validation complete: {'VALID' if is_valid else 'INVALID'} ({len(conflicts)} conflicts)")
        
        return is_valid, conflicts
    
    def check_room_conflicts(self) -> List[ViolationDetail]:
        """
        Check for room double-booking conflicts.
        
        Returns:
            List of violation details for room conflicts
        """
        conflicts = []
        
        # Group assignments by room and day
        room_day_assignments: Dict[Tuple[int, Day], List[AssignmentOutput]] = {}
        
        for assignment in self.assignments:
            key = (assignment.room_id, assignment.day)
            if key not in room_day_assignments:
                room_day_assignments[key] = []
            room_day_assignments[key].append(assignment)
        
        # Check each room-day combination for overlaps
        for (room_id, day), assignments_list in room_day_assignments.items():
            if len(assignments_list) < 2:
                continue
            
            # Check all pairs for time overlaps
            for i in range(len(assignments_list)):
                for j in range(i + 1, len(assignments_list)):
                    a1 = assignments_list[i]
                    a2 = assignments_list[j]
                    
                    if self._times_overlap(a1.start_time, a1.end_time, a2.start_time, a2.end_time):
                        room = self.rooms[room_id]
                        course1 = self.courses[a1.course_id]
                        course2 = self.courses[a2.course_id]
                        
                        conflicts.append(ViolationDetail(
                            constraint_type="room_conflict",
                            severity="hard",
                            description=(
                                f"Room {room.name} double-booked on {day.value}: "
                                f"{course1.code} ({a1.start_time}-{a1.end_time}) conflicts with "
                                f"{course2.code} ({a2.start_time}-{a2.end_time})"
                            ),
                            affected_assignments=[a1.course_id, a2.course_id]
                        ))
        
        logger.debug(f"Found {len(conflicts)} room conflicts")
        return conflicts
    
    def check_instructor_conflicts(self) -> List[ViolationDetail]:
        """
        Check for instructor double-booking conflicts.
        
        Returns:
            List of violation details for instructor conflicts
        """
        conflicts = []
        
        # Group assignments by instructor and day
        instructor_day_assignments: Dict[Tuple[int, Day], List[AssignmentOutput]] = {}
        
        for assignment in self.assignments:
            key = (assignment.instructor_id, assignment.day)
            if key not in instructor_day_assignments:
                instructor_day_assignments[key] = []
            instructor_day_assignments[key].append(assignment)
        
        # Check each instructor-day combination for overlaps
        for (instructor_id, day), assignments_list in instructor_day_assignments.items():
            if len(assignments_list) < 2:
                continue
            
            # Check all pairs for time overlaps
            for i in range(len(assignments_list)):
                for j in range(i + 1, len(assignments_list)):
                    a1 = assignments_list[i]
                    a2 = assignments_list[j]
                    
                    if self._times_overlap(a1.start_time, a1.end_time, a2.start_time, a2.end_time):
                        instructor = self.instructors[instructor_id]
                        course1 = self.courses[a1.course_id]
                        course2 = self.courses[a2.course_id]
                        
                        conflicts.append(ViolationDetail(
                            constraint_type="instructor_conflict",
                            severity="hard",
                            description=(
                                f"Instructor {instructor.name} double-booked on {day.value}: "
                                f"{course1.code} ({a1.start_time}-{a1.end_time}) conflicts with "
                                f"{course2.code} ({a2.start_time}-{a2.end_time})"
                            ),
                            affected_assignments=[a1.course_id, a2.course_id]
                        ))
        
        logger.debug(f"Found {len(conflicts)} instructor conflicts")
        return conflicts
    
    def check_group_conflicts(self) -> List[ViolationDetail]:
        """
        Check for student group double-booking conflicts.
        
        Returns:
            List of violation details for group conflicts
        """
        conflicts = []
        
        # Group assignments by student group and day
        group_day_assignments: Dict[Tuple[int, Day], List[AssignmentOutput]] = {}
        
        for assignment in self.assignments:
            key = (assignment.group_id, assignment.day)
            if key not in group_day_assignments:
                group_day_assignments[key] = []
            group_day_assignments[key].append(assignment)
        
        # Check each group-day combination for overlaps
        for (group_id, day), assignments_list in group_day_assignments.items():
            if len(assignments_list) < 2:
                continue
            
            # Check all pairs for time overlaps
            for i in range(len(assignments_list)):
                for j in range(i + 1, len(assignments_list)):
                    a1 = assignments_list[i]
                    a2 = assignments_list[j]
                    
                    if self._times_overlap(a1.start_time, a1.end_time, a2.start_time, a2.end_time):
                        group = self.groups[group_id]
                        course1 = self.courses[a1.course_id]
                        course2 = self.courses[a2.course_id]
                        
                        conflicts.append(ViolationDetail(
                            constraint_type="group_conflict",
                            severity="hard",
                            description=(
                                f"Student group {group.name} double-booked on {day.value}: "
                                f"{course1.code} ({a1.start_time}-{a1.end_time}) conflicts with "
                                f"{course2.code} ({a2.start_time}-{a2.end_time})"
                            ),
                            affected_assignments=[a1.course_id, a2.course_id]
                        ))
        
        logger.debug(f"Found {len(conflicts)} group conflicts")
        return conflicts
    
    def check_room_capacity_constraints(self) -> List[ViolationDetail]:
        """
        Check if room capacity is sufficient for student groups.
        
        Returns:
            List of violation details for room capacity violations
        """
        conflicts = []
        
        for assignment in self.assignments:
            room = self.rooms[assignment.room_id]
            group = self.groups[assignment.group_id]
            
            if group.size > room.capacity:
                course = self.courses[assignment.course_id]
                
                conflicts.append(ViolationDetail(
                    constraint_type="room_capacity",
                    severity="hard",
                    description=(
                        f"Room {room.name} (capacity {room.capacity}) insufficient for "
                        f"group {group.name} (size {group.size}) in course {course.code} "
                        f"on {assignment.day.value} at {assignment.start_time}"
                    ),
                    affected_assignments=[assignment.course_id]
                ))
        
        logger.debug(f"Found {len(conflicts)} room capacity violations")
        return conflicts
    
    def check_room_type_constraints(self) -> List[ViolationDetail]:
        """
        Check if room type matches course requirements.
        
        Returns:
            List of violation details for room type violations
        """
        conflicts = []
        
        for assignment in self.assignments:
            course = self.courses[assignment.course_id]
            room = self.rooms[assignment.room_id]
            
            # Check if course requires specific room type
            if course.room_type and course.room_type != room.type:
                conflicts.append(ViolationDetail(
                    constraint_type="room_type",
                    severity="hard",
                    description=(
                        f"Course {course.code} requires room type '{course.room_type}' "
                        f"but assigned to room {room.name} of type '{room.type}' "
                        f"on {assignment.day.value} at {assignment.start_time}"
                    ),
                    affected_assignments=[assignment.course_id]
                ))
        
        logger.debug(f"Found {len(conflicts)} room type violations")
        return conflicts
    
    def check_instructor_availability(self) -> List[ViolationDetail]:
        """
        Check if instructors are assigned only during their available times.
        
        Returns:
            List of violation details for instructor availability violations
        """
        conflicts = []
        
        for assignment in self.assignments:
            instructor = self.instructors[assignment.instructor_id]
            
            # Get available time ranges for this day
            available_ranges = instructor.availability.get(assignment.day, [])
            
            if not available_ranges:
                # Instructor not available on this day
                course = self.courses[assignment.course_id]
                
                conflicts.append(ViolationDetail(
                    constraint_type="instructor_availability",
                    severity="hard",
                    description=(
                        f"Instructor {instructor.name} not available on {assignment.day.value} "
                        f"but assigned to course {course.code} at {assignment.start_time}"
                    ),
                    affected_assignments=[assignment.course_id]
                ))
                continue
            
            # Check if assignment time is within any available range
            assignment_start_min = self._time_to_minutes(assignment.start_time)
            assignment_end_min = self._time_to_minutes(assignment.end_time)
            
            is_available = False
            for time_range in available_ranges:
                if '-' in time_range:
                    range_start, range_end = time_range.split('-')
                    range_start_min = self._time_to_minutes(range_start)
                    range_end_min = self._time_to_minutes(range_end)
                    
                    # Check if assignment is fully within this range
                    if range_start_min <= assignment_start_min and assignment_end_min <= range_end_min:
                        is_available = True
                        break
            
            if not is_available:
                course = self.courses[assignment.course_id]
                
                conflicts.append(ViolationDetail(
                    constraint_type="instructor_availability",
                    severity="hard",
                    description=(
                        f"Instructor {instructor.name} not available at {assignment.start_time}-{assignment.end_time} "
                        f"on {assignment.day.value} but assigned to course {course.code}"
                    ),
                    affected_assignments=[assignment.course_id]
                ))
        
        logger.debug(f"Found {len(conflicts)} instructor availability violations")
        return conflicts
    
    def check_working_hours(self) -> List[ViolationDetail]:
        """
        Check if all assignments are within defined working hours.
        
        Returns:
            List of violation details for working hours violations
        """
        conflicts = []
        
        working_start = self.payload.constraints.working_hours_start
        working_end = self.payload.constraints.working_hours_end
        
        working_start_min = self._time_to_minutes(working_start)
        working_end_min = self._time_to_minutes(working_end)
        
        for assignment in self.assignments:
            assignment_start_min = self._time_to_minutes(assignment.start_time)
            assignment_end_min = self._time_to_minutes(assignment.end_time)
            
            if assignment_start_min < working_start_min or assignment_end_min > working_end_min:
                course = self.courses[assignment.course_id]
                
                conflicts.append(ViolationDetail(
                    constraint_type="working_hours",
                    severity="hard",
                    description=(
                        f"Course {course.code} scheduled outside working hours "
                        f"({working_start}-{working_end}): "
                        f"{assignment.day.value} at {assignment.start_time}-{assignment.end_time}"
                    ),
                    affected_assignments=[assignment.course_id]
                ))
        
        logger.debug(f"Found {len(conflicts)} working hours violations")
        return conflicts


def validate_timetable(payload: GenerationPayload, assignments: List[AssignmentOutput]) -> Tuple[bool, List[ViolationDetail]]:
    """
    Main entry point for timetable validation.
    
    Args:
        payload: Validation request containing courses, instructors, rooms, groups, and constraints
        assignments: List of assignments to validate
        
    Returns:
        Tuple of (is_valid, conflicts) where is_valid is True if no hard constraint violations found
    """
    try:
        # Create validator instance
        validator = TimetableValidator(payload)
        
        # Set assignments to validate
        validator.set_assignments(assignments)
        
        # Run validation
        is_valid, conflicts = validator.validate_all()
        
        return is_valid, conflicts
    
    except Exception as e:
        logger.error(f"Error during validation: {str(e)}", exc_info=True)
        raise
