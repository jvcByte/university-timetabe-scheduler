"""
OR-Tools constraint programming solver for timetable optimization.

This module implements the core solver logic using Google OR-Tools CP-SAT solver
to generate optimized university timetables that satisfy hard constraints and
minimize soft constraint violations.
"""

import logging
from typing import List, Dict, Tuple, Optional
from ortools.sat.python import cp_model
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


class TimetableOptimizer:
    """
    Timetable optimizer using OR-Tools CP-SAT solver.
    
    This class handles the conversion of timetable scheduling problem into
    a constraint programming model and solves it to find optimal assignments.
    """
    
    def __init__(self, payload: GenerationPayload):
        """
        Initialize the optimizer with input data.
        
        Args:
            payload: Generation request containing courses, instructors, rooms, groups, and constraints
        """
        self.payload = payload
        self.model = cp_model.CpModel()
        
        # Parse input data into internal structures
        self.courses = {c.id: c for c in payload.courses}
        self.instructors = {i.id: i for i in payload.instructors}
        self.rooms = {r.id: r for r in payload.rooms}
        self.groups = {g.id: g for g in payload.groups}
        
        # Define time slot grid
        self.days = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY]
        self.time_slots = self._generate_time_slots()
        
        # Decision variables and tracking
        self.assignment_vars = {}
        self.penalty_vars = []
        
        logger.info(
            f"Initialized optimizer: {len(self.courses)} courses, "
            f"{len(self.time_slots)} time slots per day, "
            f"{len(self.days)} days"
        )
    
    def _generate_time_slots(self) -> List[Tuple[str, str]]:
        """
        Generate time slots based on working hours and course durations.
        
        Returns:
            List of (start_time, end_time) tuples representing possible time slots
        """
        working_start = self.payload.constraints.working_hours_start
        working_end = self.payload.constraints.working_hours_end
        
        # Parse working hours (format: "HH:MM")
        start_hour, start_min = map(int, working_start.split(':'))
        end_hour, end_min = map(int, working_end.split(':'))
        
        start_minutes = start_hour * 60 + start_min
        end_minutes = end_hour * 60 + end_min
        
        # Find minimum course duration to determine slot granularity
        min_duration = min(c.duration for c in self.courses.values())
        
        # Generate time slots with the minimum duration as step
        time_slots = []
        current = start_minutes
        
        while current + min_duration <= end_minutes:
            start_time = f"{current // 60:02d}:{current % 60:02d}"
            end_time = f"{(current + min_duration) // 60:02d}:{(current + min_duration) % 60:02d}"
            time_slots.append((start_time, end_time))
            current += min_duration
        
        logger.info(f"Generated {len(time_slots)} time slots from {working_start} to {working_end}")
        return time_slots
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert time string (HH:MM) to minutes since midnight."""
        hour, minute = map(int, time_str.split(':'))
        return hour * 60 + minute
    
    def _get_slot_index_for_course(self, course: CourseInput, slot_start: str) -> Optional[int]:
        """
        Find the time slot index that can accommodate a course starting at slot_start.
        
        Args:
            course: Course to schedule
            slot_start: Start time of the slot
            
        Returns:
            Slot index if valid, None otherwise
        """
        slot_start_min = self._time_to_minutes(slot_start)
        slot_end_min = slot_start_min + course.duration
        
        # Find matching slot
        for idx, (start, end) in enumerate(self.time_slots):
            if start == slot_start:
                # Check if course fits within working hours
                working_end_min = self._time_to_minutes(self.payload.constraints.working_hours_end)
                if slot_end_min <= working_end_min:
                    return idx
                break
        
        return None
    
    def create_decision_variables(self):
        """
        Create decision variables for the CP-SAT model.
        
        For each course, we create boolean variables for each possible assignment:
        x[course_id, day, slot_idx, room_id, instructor_id, group_id] = 1 if assigned, 0 otherwise
        """
        logger.info("Creating decision variables...")
        
        for course in self.courses.values():
            for day in self.days:
                for slot_idx, (slot_start, slot_end) in enumerate(self.time_slots):
                    # Check if course can fit in this slot
                    slot_start_min = self._time_to_minutes(slot_start)
                    slot_end_min = slot_start_min + course.duration
                    working_end_min = self._time_to_minutes(self.payload.constraints.working_hours_end)
                    
                    if slot_end_min > working_end_min:
                        continue  # Course doesn't fit in this slot
                    
                    for room in self.rooms.values():
                        for instructor_id in course.instructor_ids:
                            for group_id in course.group_ids:
                                var_name = f"assign_c{course.id}_d{day.value}_s{slot_idx}_r{room.id}_i{instructor_id}_g{group_id}"
                                var = self.model.NewBoolVar(var_name)
                                
                                key = (course.id, day, slot_idx, room.id, instructor_id, group_id)
                                self.assignment_vars[key] = var
        
        logger.info(f"Created {len(self.assignment_vars)} decision variables")
    
    def get_assignment_vars_for_course(self, course_id: int) -> List:
        """Get all assignment variables for a specific course."""
        return [
            var for key, var in self.assignment_vars.items()
            if key[0] == course_id
        ]
    
    def get_assignment_vars_for_room_slot(self, room_id: int, day: Day, slot_idx: int) -> List:
        """Get all assignment variables for a specific room at a specific time slot."""
        vars_list = []
        for key, var in self.assignment_vars.items():
            c_id, d, s_idx, r_id, i_id, g_id = key
            if r_id == room_id and d == day and s_idx == slot_idx:
                # Check if course overlaps with this slot
                course = self.courses[c_id]
                vars_list.append(var)
        return vars_list
    
    def get_assignment_vars_for_instructor_slot(self, instructor_id: int, day: Day, slot_idx: int) -> List:
        """Get all assignment variables for a specific instructor at a specific time slot."""
        vars_list = []
        for key, var in self.assignment_vars.items():
            c_id, d, s_idx, i_id, g_id = key
            if i_id == instructor_id and d == day and s_idx == slot_idx:
                course = self.courses[c_id]
                vars_list.append(var)
        return vars_list
    
    def get_assignment_vars_for_group_slot(self, group_id: int, day: Day, slot_idx: int) -> List:
        """Get all assignment variables for a specific group at a specific time slot."""
        vars_list = []
        for key, var in self.assignment_vars.items():
            c_id, d, s_idx, r_id, i_id, g_id = key
            if g_id == group_id and d == day and s_idx == slot_idx:
                course = self.courses[c_id]
                vars_list.append(var)
        return vars_list

    def add_hard_constraints(self):
        """
        Add all hard constraints to the model.
        
        Hard constraints must be satisfied for a valid timetable:
        1. Each course assigned exactly once
        2. No room double-booking
        3. No instructor double-booking
        4. No student group double-booking
        5. Room capacity >= group size
        6. Room type matches course requirements
        7. Respect instructor availability
        8. Assignments within working hours
        """
        logger.info("Adding hard constraints...")
        
        # 1. Each course must be assigned exactly once
        self._add_course_assignment_constraint()
        
        # 2. No room double-booking
        if self.payload.constraints.hard.get('noRoomDoubleBooking', True):
            self._add_room_conflict_constraint()
        
        # 3. No instructor double-booking
        if self.payload.constraints.hard.get('noInstructorDoubleBooking', True):
            self._add_instructor_conflict_constraint()
        
        # 4. No student group double-booking
        self._add_group_conflict_constraint()
        
        # 5. Room capacity constraint
        if self.payload.constraints.hard.get('roomCapacityCheck', True):
            self._add_room_capacity_constraint()
        
        # 6. Room type matching
        if self.payload.constraints.hard.get('roomTypeMatch', True):
            self._add_room_type_constraint()
        
        # 7. Instructor availability
        self._add_instructor_availability_constraint()
        
        # 8. Working hours constraint (already handled in variable creation)
        logger.info("Hard constraints added successfully")
    
    def _add_course_assignment_constraint(self):
        """Ensure each course is assigned exactly once."""
        for course in self.courses.values():
            course_vars = self.get_assignment_vars_for_course(course.id)
            if course_vars:
                self.model.Add(sum(course_vars) == 1)
        
        logger.debug(f"Added assignment constraints for {len(self.courses)} courses")
    
    def _add_room_conflict_constraint(self):
        """Ensure no room is double-booked (considering course duration)."""
        constraint_count = 0
        
        for room in self.rooms.values():
            for day in self.days:
                for slot_idx in range(len(self.time_slots)):
                    # Get all courses that would occupy this room at this time
                    conflicting_vars = []
                    
                    for key, var in self.assignment_vars.items():
                        c_id, d, s_idx, r_id, i_id, g_id = key
                        
                        if r_id == room.id and d == day:
                            # Check if course overlaps with this slot
                            course = self.courses[c_id]
                            course_duration_slots = (course.duration + len(self.time_slots[0]) - 1) // len(self.time_slots[0])
                            
                            # Course starting at s_idx occupies slots [s_idx, s_idx + duration_slots)
                            if s_idx <= slot_idx < s_idx + course_duration_slots:
                                conflicting_vars.append(var)
                    
                    # At most one course can occupy this room at this time
                    if len(conflicting_vars) > 1:
                        self.model.Add(sum(conflicting_vars) <= 1)
                        constraint_count += 1
        
        logger.debug(f"Added {constraint_count} room conflict constraints")
    
    def _add_instructor_conflict_constraint(self):
        """Ensure no instructor is double-booked (considering course duration)."""
        constraint_count = 0
        
        for instructor in self.instructors.values():
            for day in self.days:
                for slot_idx in range(len(self.time_slots)):
                    # Get all courses that would require this instructor at this time
                    conflicting_vars = []
                    
                    for key, var in self.assignment_vars.items():
                        c_id, d, s_idx, r_id, i_id, g_id = key
                        
                        if i_id == instructor.id and d == day:
                            # Check if course overlaps with this slot
                            course = self.courses[c_id]
                            course_duration_slots = (course.duration + len(self.time_slots[0]) - 1) // len(self.time_slots[0])
                            
                            if s_idx <= slot_idx < s_idx + course_duration_slots:
                                conflicting_vars.append(var)
                    
                    # At most one course per instructor at this time
                    if len(conflicting_vars) > 1:
                        self.model.Add(sum(conflicting_vars) <= 1)
                        constraint_count += 1
        
        logger.debug(f"Added {constraint_count} instructor conflict constraints")
    
    def _add_group_conflict_constraint(self):
        """Ensure no student group is double-booked (considering course duration)."""
        constraint_count = 0
        
        for group in self.groups.values():
            for day in self.days:
                for slot_idx in range(len(self.time_slots)):
                    # Get all courses that would require this group at this time
                    conflicting_vars = []
                    
                    for key, var in self.assignment_vars.items():
                        c_id, d, s_idx, r_id, i_id, g_id = key
                        
                        if g_id == group.id and d == day:
                            # Check if course overlaps with this slot
                            course = self.courses[c_id]
                            course_duration_slots = (course.duration + len(self.time_slots[0]) - 1) // len(self.time_slots[0])
                            
                            if s_idx <= slot_idx < s_idx + course_duration_slots:
                                conflicting_vars.append(var)
                    
                    # At most one course per group at this time
                    if len(conflicting_vars) > 1:
                        self.model.Add(sum(conflicting_vars) <= 1)
                        constraint_count += 1
        
        logger.debug(f"Added {constraint_count} group conflict constraints")
    
    def _add_room_capacity_constraint(self):
        """Ensure room capacity is sufficient for the student group."""
        constraint_count = 0
        
        for key, var in self.assignment_vars.items():
            c_id, d, s_idx, r_id, i_id, g_id = key
            
            room = self.rooms[r_id]
            group = self.groups[g_id]
            
            # If group size exceeds room capacity, this assignment is not allowed
            if group.size > room.capacity:
                self.model.Add(var == 0)
                constraint_count += 1
        
        logger.debug(f"Added {constraint_count} room capacity constraints")
    
    def _add_room_type_constraint(self):
        """Ensure room type matches course requirements."""
        constraint_count = 0
        
        for key, var in self.assignment_vars.items():
            c_id, d, s_idx, r_id, i_id, g_id = key
            
            course = self.courses[c_id]
            room = self.rooms[r_id]
            
            # If course requires specific room type and room doesn't match, disallow
            if course.room_type and course.room_type != room.type:
                self.model.Add(var == 0)
                constraint_count += 1
        
        logger.debug(f"Added {constraint_count} room type constraints")
    
    def _add_instructor_availability_constraint(self):
        """Ensure instructors are only assigned during their available times."""
        constraint_count = 0
        
        for instructor in self.instructors.values():
            for day in self.days:
                # Get available time ranges for this day
                available_ranges = instructor.availability.get(day, [])
                
                if not available_ranges:
                    # Instructor not available on this day - block all assignments
                    for key, var in self.assignment_vars.items():
                        c_id, d, s_idx, r_id, i_id, g_id = key
                        if i_id == instructor.id and d == day:
                            self.model.Add(var == 0)
                            constraint_count += 1
                else:
                    # Check each time slot
                    for slot_idx, (slot_start, slot_end) in enumerate(self.time_slots):
                        slot_start_min = self._time_to_minutes(slot_start)
                        
                        # Check if slot is within any available range
                        is_available = False
                        for time_range in available_ranges:
                            # Parse range (format: "HH:MM-HH:MM")
                            if '-' in time_range:
                                range_start, range_end = time_range.split('-')
                                range_start_min = self._time_to_minutes(range_start)
                                range_end_min = self._time_to_minutes(range_end)
                                
                                if range_start_min <= slot_start_min < range_end_min:
                                    is_available = True
                                    break
                        
                        # If not available, block assignments at this time
                        if not is_available:
                            for key, var in self.assignment_vars.items():
                                c_id, d, s_idx, r_id, i_id, g_id = key
                                if i_id == instructor.id and d == day and s_idx == slot_idx:
                                    self.model.Add(var == 0)
                                    constraint_count += 1
        
        logger.debug(f"Added {constraint_count} instructor availability constraints")

    def add_soft_constraints(self):
        """
        Add soft constraints with penalties to the model.
        
        Soft constraints are preferences that should be optimized but can be violated:
        1. Instructor time preferences
        2. Compact student schedules (minimize gaps)
        3. Balanced daily load
        4. Preferred room assignments
        
        Each violation adds a weighted penalty to the objective function.
        """
        logger.info("Adding soft constraints...")
        
        # Get weights from configuration
        pref_weight = self.payload.constraints.soft.get('instructorPreferencesWeight', 5)
        compact_weight = self.payload.constraints.soft.get('compactSchedulesWeight', 7)
        balanced_weight = self.payload.constraints.soft.get('balancedDailyLoadWeight', 6)
        room_weight = self.payload.constraints.soft.get('preferredRoomsWeight', 3)
        
        # 1. Instructor preference violations
        if pref_weight > 0:
            self._add_instructor_preference_penalties(pref_weight)
        
        # 2. Non-compact schedules (gaps between classes)
        if compact_weight > 0:
            self._add_schedule_compactness_penalties(compact_weight)
        
        # 3. Unbalanced daily load
        if balanced_weight > 0:
            self._add_balanced_load_penalties(balanced_weight)
        
        # 4. Non-preferred room assignments
        if room_weight > 0:
            self._add_room_preference_penalties(room_weight)
        
        logger.info(f"Added {len(self.penalty_vars)} penalty variables for soft constraints")
    
    def _add_instructor_preference_penalties(self, weight: int):
        """Add penalties for violating instructor time preferences."""
        penalty_count = 0
        
        for instructor in self.instructors.values():
            if not instructor.preferences:
                continue
            
            preferred_days = instructor.preferences.get('preferredDays', [])
            preferred_times = instructor.preferences.get('preferredTimes', [])
            
            if not preferred_days and not preferred_times:
                continue
            
            # Add penalty for assignments outside preferred days
            if preferred_days:
                for key, var in self.assignment_vars.items():
                    c_id, d, s_idx, r_id, i_id, g_id = key
                    
                    if i_id == instructor.id and d.value not in preferred_days:
                        # Create penalty variable
                        penalty_var = self.model.NewBoolVar(f"penalty_pref_i{i_id}_d{d.value}_s{s_idx}")
                        self.model.Add(penalty_var == var)
                        self.penalty_vars.append((penalty_var, weight * 10))  # Scale penalty
                        penalty_count += 1
            
            # Add penalty for assignments outside preferred times
            if preferred_times:
                for key, var in self.assignment_vars.items():
                    c_id, d, s_idx, r_id, i_id, g_id = key
                    
                    if i_id == instructor.id:
                        slot_start, _ = self.time_slots[s_idx]
                        slot_start_min = self._time_to_minutes(slot_start)
                        
                        # Check if slot is in preferred times
                        is_preferred = False
                        for time_range in preferred_times:
                            if '-' in time_range:
                                range_start, range_end = time_range.split('-')
                                range_start_min = self._time_to_minutes(range_start)
                                range_end_min = self._time_to_minutes(range_end)
                                
                                if range_start_min <= slot_start_min < range_end_min:
                                    is_preferred = True
                                    break
                        
                        if not is_preferred:
                            penalty_var = self.model.NewBoolVar(f"penalty_time_i{i_id}_s{s_idx}")
                            self.model.Add(penalty_var == var)
                            self.penalty_vars.append((penalty_var, weight * 10))
                            penalty_count += 1
        
        logger.debug(f"Added {penalty_count} instructor preference penalties")
    
    def _add_schedule_compactness_penalties(self, weight: int):
        """Add penalties for gaps in student group schedules."""
        penalty_count = 0
        
        for group in self.groups.values():
            for day in self.days:
                # For each day, penalize gaps between classes
                # Simplified approach: penalize when there's a gap between consecutive classes
                
                for slot_idx in range(len(self.time_slots) - 2):
                    # Check if there's a class at slot_idx and slot_idx+2, but not at slot_idx+1
                    slot_vars = []
                    middle_vars = []
                    later_vars = []
                    
                    for key, var in self.assignment_vars.items():
                        c_id, d, s_idx, r_id, i_id, g_id = key
                        if g_id == group.id and d == day:
                            if s_idx == slot_idx:
                                slot_vars.append(var)
                            elif s_idx == slot_idx + 1:
                                middle_vars.append(var)
                            elif s_idx == slot_idx + 2:
                                later_vars.append(var)
                    
                    # If we have potential for a gap
                    if slot_vars and later_vars:
                        # Create penalty for each combination that creates a gap
                        for start_var in slot_vars:
                            for end_var in later_vars:
                                # Gap penalty: if both start and end are assigned but middle is empty
                                gap_penalty = self.model.NewBoolVar(f"gap_g{group.id}_d{day.value}_s{slot_idx}_{penalty_count}")
                                
                                # gap_penalty = 1 if (start_var = 1 AND end_var = 1 AND sum(middle_vars) = 0)
                                # This is approximated by: gap_penalty >= start_var + end_var - 1 - sum(middle_vars)
                                if middle_vars:
                                    self.model.Add(gap_penalty >= start_var + end_var - 1 - sum(middle_vars))
                                else:
                                    # No middle class possible, so gap exists if both ends exist
                                    self.model.Add(gap_penalty >= start_var + end_var - 1)
                                
                                self.penalty_vars.append((gap_penalty, weight * 10))
                                penalty_count += 1
        
        logger.debug(f"Added {penalty_count} schedule compactness penalties")
    
    def _add_balanced_load_penalties(self, weight: int):
        """Add penalties for unbalanced daily teaching load."""
        penalty_count = 0
        
        # For each instructor, try to balance classes across days
        # Simplified: penalize if any day has significantly more classes than others
        for instructor in self.instructors.values():
            daily_counts = {}
            
            for day in self.days:
                # Count classes for this instructor on this day
                day_assignments = []
                
                for key, var in self.assignment_vars.items():
                    c_id, d, s_idx, r_id, i_id, g_id = key
                    if i_id == instructor.id and d == day:
                        day_assignments.append(var)
                
                if day_assignments:
                    day_var = self.model.NewIntVar(0, 100, f"count_i{instructor.id}_d{day.value}")
                    self.model.Add(day_var == sum(day_assignments))
                    daily_counts[day] = day_var
            
            # Penalize large differences between days
            if len(daily_counts) > 1:
                days_list = list(daily_counts.keys())
                for i in range(len(days_list)):
                    for j in range(i + 1, len(days_list)):
                        # Penalize difference between day i and day j
                        diff = self.model.NewIntVar(0, 100, f"diff_i{instructor.id}_d{i}_d{j}")
                        self.model.AddAbsEquality(diff, daily_counts[days_list[i]] - daily_counts[days_list[j]])
                        self.penalty_vars.append((diff, weight * 2))
                        penalty_count += 1
        
        logger.debug(f"Added {penalty_count} balanced load penalties")
    
    def _add_room_preference_penalties(self, weight: int):
        """Add penalties for non-preferred room assignments."""
        penalty_count = 0
        
        # Prefer rooms that match department or have better equipment
        for course in self.courses.values():
            for key, var in self.assignment_vars.items():
                c_id, d, s_idx, r_id, i_id, g_id = key
                
                if c_id == course.id:
                    room = self.rooms[r_id]
                    
                    # Penalize if room type doesn't exactly match (but is still valid)
                    if course.room_type and room.type != course.room_type:
                        # This would be blocked by hard constraint, so skip
                        pass
                    else:
                        # Small penalty for using larger rooms than necessary
                        group = self.groups[g_id]
                        if room.capacity > group.size * 1.5:
                            penalty_var = self.model.NewBoolVar(f"penalty_room_size_c{c_id}_r{r_id}")
                            self.model.Add(penalty_var == var)
                            self.penalty_vars.append((penalty_var, weight * 5))
                            penalty_count += 1
        
        logger.debug(f"Added {penalty_count} room preference penalties")
    
    def set_objective(self):
        """Set the objective function to minimize total weighted penalties."""
        if self.penalty_vars:
            # Minimize sum of all weighted penalties
            objective_terms = [var * weight for var, weight in self.penalty_vars]
            self.model.Minimize(sum(objective_terms))
            logger.info(f"Objective set to minimize {len(self.penalty_vars)} penalty terms")
        else:
            logger.info("No soft constraints - using feasibility check only")

    def extract_solution(self, solver: cp_model.CpSolver) -> Tuple[List[AssignmentOutput], float, List[ViolationDetail]]:
        """
        Extract assignments from the solved model.
        
        Args:
            solver: The solved CP-SAT solver instance
            
        Returns:
            Tuple of (assignments, fitness_score, violations)
        """
        logger.info("Extracting solution...")
        
        assignments = []
        violations = []
        
        # Extract assignments from decision variables
        for key, var in self.assignment_vars.items():
            if solver.Value(var) == 1:
                c_id, day, slot_idx, r_id, i_id, g_id = key
                
                course = self.courses[c_id]
                slot_start, _ = self.time_slots[slot_idx]
                
                # Calculate end time based on course duration
                start_minutes = self._time_to_minutes(slot_start)
                end_minutes = start_minutes + course.duration
                end_time = f"{end_minutes // 60:02d}:{end_minutes % 60:02d}"
                
                assignment = AssignmentOutput(
                    course_id=c_id,
                    instructor_id=i_id,
                    room_id=r_id,
                    group_id=g_id,
                    day=day,
                    start_time=slot_start,
                    end_time=end_time
                )
                assignments.append(assignment)
        
        logger.info(f"Extracted {len(assignments)} assignments")
        
        # Calculate fitness score (lower is better)
        fitness_score = self._calculate_fitness_score(solver)
        
        # Identify soft constraint violations
        violations = self._identify_violations(solver, assignments)
        
        return assignments, fitness_score, violations
    
    def _calculate_fitness_score(self, solver: cp_model.CpSolver) -> float:
        """
        Calculate fitness score based on objective value.
        
        Lower scores are better. Score of 0 means all soft constraints satisfied.
        
        Args:
            solver: The solved CP-SAT solver instance
            
        Returns:
            Fitness score (normalized penalty sum)
        """
        if not self.penalty_vars:
            return 0.0
        
        total_penalty = solver.ObjectiveValue()
        
        # Normalize by maximum possible penalty
        max_possible_penalty = sum(weight for _, weight in self.penalty_vars)
        
        if max_possible_penalty > 0:
            fitness_score = (total_penalty / max_possible_penalty) * 100.0
        else:
            fitness_score = 0.0
        
        logger.info(f"Fitness score: {fitness_score:.2f} (total penalty: {total_penalty})")
        
        return fitness_score
    
    def _identify_violations(self, solver: cp_model.CpSolver, assignments: List[AssignmentOutput]) -> List[ViolationDetail]:
        """
        Identify which soft constraints were violated in the solution.
        
        Args:
            solver: The solved CP-SAT solver instance
            assignments: List of assignments in the solution
            
        Returns:
            List of violation details
        """
        violations = []
        
        # Check instructor preference violations
        violations.extend(self._check_instructor_preference_violations(solver, assignments))
        
        # Check schedule compactness violations
        violations.extend(self._check_compactness_violations(solver, assignments))
        
        # Check balanced load violations
        violations.extend(self._check_balanced_load_violations(solver, assignments))
        
        # Check room preference violations
        violations.extend(self._check_room_preference_violations(solver, assignments))
        
        logger.info(f"Identified {len(violations)} soft constraint violations")
        
        return violations
    
    def _check_instructor_preference_violations(self, solver: cp_model.CpSolver, assignments: List[AssignmentOutput]) -> List[ViolationDetail]:
        """Check for instructor preference violations."""
        violations = []
        
        for assignment in assignments:
            instructor = self.instructors[assignment.instructor_id]
            
            if not instructor.preferences:
                continue
            
            preferred_days = instructor.preferences.get('preferredDays', [])
            preferred_times = instructor.preferences.get('preferredTimes', [])
            
            # Check day preference
            if preferred_days and assignment.day.value not in preferred_days:
                violations.append(ViolationDetail(
                    constraint_type="instructor_day_preference",
                    severity="soft",
                    description=f"Instructor {instructor.name} assigned on non-preferred day {assignment.day.value}",
                    affected_assignments=[assignment.course_id]
                ))
            
            # Check time preference
            if preferred_times:
                slot_start_min = self._time_to_minutes(assignment.start_time)
                is_preferred = False
                
                for time_range in preferred_times:
                    if '-' in time_range:
                        range_start, range_end = time_range.split('-')
                        range_start_min = self._time_to_minutes(range_start)
                        range_end_min = self._time_to_minutes(range_end)
                        
                        if range_start_min <= slot_start_min < range_end_min:
                            is_preferred = True
                            break
                
                if not is_preferred:
                    violations.append(ViolationDetail(
                        constraint_type="instructor_time_preference",
                        severity="soft",
                        description=f"Instructor {instructor.name} assigned outside preferred times at {assignment.start_time}",
                        affected_assignments=[assignment.course_id]
                    ))
        
        return violations
    
    def _check_compactness_violations(self, solver: cp_model.CpSolver, assignments: List[AssignmentOutput]) -> List[ViolationDetail]:
        """Check for schedule compactness violations (gaps)."""
        violations = []
        
        for group in self.groups.values():
            for day in self.days:
                # Get all assignments for this group on this day
                day_assignments = [
                    a for a in assignments
                    if a.group_id == group.id and a.day == day
                ]
                
                if len(day_assignments) < 2:
                    continue
                
                # Sort by start time
                day_assignments.sort(key=lambda a: self._time_to_minutes(a.start_time))
                
                # Check for gaps
                for i in range(len(day_assignments) - 1):
                    current_end = self._time_to_minutes(day_assignments[i].end_time)
                    next_start = self._time_to_minutes(day_assignments[i + 1].start_time)
                    
                    gap_minutes = next_start - current_end
                    
                    # If gap is more than 60 minutes, report violation
                    if gap_minutes > 60:
                        violations.append(ViolationDetail(
                            constraint_type="schedule_compactness",
                            severity="soft",
                            description=f"Group {group.name} has {gap_minutes}-minute gap on {day.value}",
                            affected_assignments=[day_assignments[i].course_id, day_assignments[i + 1].course_id]
                        ))
        
        return violations
    
    def _check_balanced_load_violations(self, solver: cp_model.CpSolver, assignments: List[AssignmentOutput]) -> List[ViolationDetail]:
        """Check for unbalanced daily load violations."""
        violations = []
        
        for instructor in self.instructors.values():
            daily_counts = {}
            
            for day in self.days:
                count = sum(1 for a in assignments if a.instructor_id == instructor.id and a.day == day)
                daily_counts[day] = count
            
            if not daily_counts or max(daily_counts.values()) == 0:
                continue
            
            # Calculate variance
            counts = list(daily_counts.values())
            avg = sum(counts) / len(counts)
            variance = sum((c - avg) ** 2 for c in counts) / len(counts)
            
            # If variance is high, report violation
            if variance > 2.0:
                violations.append(ViolationDetail(
                    constraint_type="balanced_daily_load",
                    severity="soft",
                    description=f"Instructor {instructor.name} has unbalanced load (variance: {variance:.2f})",
                    affected_assignments=[]
                ))
        
        return violations
    
    def _check_room_preference_violations(self, solver: cp_model.CpSolver, assignments: List[AssignmentOutput]) -> List[ViolationDetail]:
        """Check for room preference violations."""
        violations = []
        
        for assignment in assignments:
            room = self.rooms[assignment.room_id]
            group = self.groups[assignment.group_id]
            
            # Check if room is oversized
            if room.capacity > group.size * 1.5:
                violations.append(ViolationDetail(
                    constraint_type="room_preference",
                    severity="soft",
                    description=f"Room {room.name} (capacity {room.capacity}) oversized for group {group.name} (size {group.size})",
                    affected_assignments=[assignment.course_id]
                ))
        
        return violations

    def solve(self, time_limit_seconds: int = 300) -> Tuple[cp_model.CpSolver, str]:
        """
        Solve the timetable optimization problem.
        
        Args:
            time_limit_seconds: Maximum time to spend solving (default: 300 seconds)
            
        Returns:
            Tuple of (solver, status_message)
        """
        logger.info(f"Starting solver with time limit: {time_limit_seconds}s")
        
        # Create solver instance
        solver = cp_model.CpSolver()
        
        # Configure solver parameters
        solver.parameters.max_time_in_seconds = time_limit_seconds
        solver.parameters.num_search_workers = 8  # Use multiple threads
        solver.parameters.log_search_progress = True
        solver.parameters.cp_model_presolve = True
        solver.parameters.cp_model_probing_level = 2
        
        # Solve the model
        logger.info("Solving model...")
        status = solver.Solve(self.model)
        
        # Handle different solution statuses
        status_message = self._handle_solver_status(solver, status)
        
        return solver, status_message, status
    
    def _handle_solver_status(self, solver: cp_model.CpSolver, status: int) -> str:
        """
        Handle different solver status codes and return appropriate message.
        
        Args:
            solver: The CP-SAT solver instance
            status: The solver status code
            
        Returns:
            Human-readable status message
        """
        if status == cp_model.OPTIMAL:
            logger.info("Optimal solution found")
            return "Optimal solution found"
        
        elif status == cp_model.FEASIBLE:
            logger.info("Feasible solution found (not proven optimal)")
            return "Feasible solution found (not proven optimal)"
        
        elif status == cp_model.INFEASIBLE:
            logger.warning("No feasible solution exists")
            conflict_info = self._analyze_infeasibility()
            return f"No feasible solution: {conflict_info}"
        
        elif status == cp_model.MODEL_INVALID:
            logger.error("Model is invalid")
            return "Model is invalid - check constraint definitions"
        
        elif status == cp_model.UNKNOWN:
            logger.warning("Solver status unknown (likely timeout)")
            if solver.NumBooleans() > 0:
                return "Timeout reached - try relaxing constraints or increasing time limit"
            return "Unable to solve - problem may be too complex"
        
        else:
            logger.warning(f"Unexpected solver status: {status}")
            return f"Unexpected solver status: {status}"
    
    def _analyze_infeasibility(self) -> str:
        """
        Analyze why the problem is infeasible and provide helpful feedback.
        
        Returns:
            String describing likely causes of infeasibility
        """
        issues = []
        
        # Check if there are enough rooms
        total_courses = len(self.courses)
        total_rooms = len(self.rooms)
        total_slots = len(self.time_slots) * len(self.days)
        
        if total_courses > total_rooms * total_slots:
            issues.append(f"Not enough room-time slots ({total_rooms * total_slots}) for {total_courses} courses")
        
        # Check room capacity constraints
        for course in self.courses.values():
            for group_id in course.group_ids:
                group = self.groups[group_id]
                suitable_rooms = [r for r in self.rooms.values() if r.capacity >= group.size]
                
                if not suitable_rooms:
                    issues.append(f"No room with sufficient capacity for group {group.name} (size {group.size})")
        
        # Check room type constraints
        for course in self.courses.values():
            if course.room_type:
                matching_rooms = [r for r in self.rooms.values() if r.type == course.room_type]
                if not matching_rooms:
                    issues.append(f"No room of type '{course.room_type}' for course {course.code}")
        
        # Check instructor availability
        for instructor in self.instructors.values():
            total_available_slots = 0
            for day in self.days:
                available_ranges = instructor.availability.get(day, [])
                for time_range in available_ranges:
                    if '-' in time_range:
                        range_start, range_end = time_range.split('-')
                        range_minutes = self._time_to_minutes(range_end) - self._time_to_minutes(range_start)
                        total_available_slots += range_minutes // 60
            
            # Count courses assigned to this instructor
            instructor_courses = [c for c in self.courses.values() if instructor.id in c.instructor_ids]
            total_required_hours = sum(c.duration for c in instructor_courses) // 60
            
            if total_required_hours > total_available_slots:
                issues.append(
                    f"Instructor {instructor.name} needs {total_required_hours}h but only has {total_available_slots}h available"
                )
        
        if issues:
            return "; ".join(issues[:3])  # Return first 3 issues
        else:
            return "Hard constraints cannot be satisfied - try relaxing some constraints"
    
    def get_solver_statistics(self, solver: cp_model.CpSolver) -> Dict[str, any]:
        """
        Get detailed solver statistics.
        
        Args:
            solver: The solved CP-SAT solver instance
            
        Returns:
            Dictionary of solver statistics
        """
        return {
            "wall_time": solver.WallTime(),
            "user_time": solver.UserTime(),
            "num_booleans": solver.NumBooleans(),
            "num_conflicts": solver.NumConflicts(),
            "num_branches": solver.NumBranches(),
            "objective_value": solver.ObjectiveValue() if self.penalty_vars else 0,
            "best_objective_bound": solver.BestObjectiveBound() if self.penalty_vars else 0,
        }


def optimize_timetable(payload: GenerationPayload) -> Tuple[bool, List[AssignmentOutput], Optional[float], List[ViolationDetail], float, str]:
    """
    Main entry point for timetable optimization.
    
    Args:
        payload: Generation request containing all input data
        
    Returns:
        Tuple of (success, assignments, fitness_score, violations, solve_time, message)
    """
    import time
    
    start_time = time.time()
    
    try:
        # Create optimizer instance
        optimizer = TimetableOptimizer(payload)
        
        # Build the model
        optimizer.create_decision_variables()
        optimizer.add_hard_constraints()
        optimizer.add_soft_constraints()
        optimizer.set_objective()
        
        # Solve the model
        solver, status_message, status = optimizer.solve(payload.time_limit_seconds)
        
        solve_time = time.time() - start_time
        
        # Check if solution was found
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            # Extract solution
            assignments, fitness_score, violations = optimizer.extract_solution(solver)
            
            # Log statistics
            stats = optimizer.get_solver_statistics(solver)
            logger.info(f"Solver statistics: {stats}")
            
            return True, assignments, fitness_score, violations, solve_time, status_message
        else:
            # No solution found
            return False, [], None, [], solve_time, status_message
    
    except Exception as e:
        solve_time = time.time() - start_time
        logger.error(f"Error during optimization: {str(e)}", exc_info=True)
        return False, [], None, [], solve_time, f"Optimization failed: {str(e)}"
