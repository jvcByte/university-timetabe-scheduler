# Solver Algorithm Documentation

## Overview

The University Timetable Scheduler provides **two solver implementations** for generating optimized timetables:

1. **Local TypeScript Solver** (Default, Recommended) - Uses Simulated Annealing with Greedy initialization
2. **Python OR-Tools Solver** - Uses Constraint Programming (CP-SAT)

Both solvers handle the same timetable scheduling problem but use different optimization approaches. The local solver is faster and runs directly in the web application, while the OR-Tools solver provides more sophisticated constraint handling through a separate microservice.

---

## Algorithm 1: Local TypeScript Solver (Simulated Annealing)

### Overview

The local solver uses a **two-phase approach**:
1. **Greedy Initialization** - Quickly generates a feasible initial solution
2. **Simulated Annealing** - Iteratively improves the solution through random perturbations

This approach is fast, efficient, and handles large datasets well (tested with 300+ courses).

### Algorithm Type: Simulated Annealing

Simulated Annealing is a probabilistic metaheuristic inspired by the annealing process in metallurgy. Key characteristics:

- **Exploration vs Exploitation**: Balances exploring new solutions with exploiting good ones
- **Temperature-based Acceptance**: Accepts worse solutions with probability based on temperature
- **Gradual Cooling**: Temperature decreases over time, reducing randomness
- **Local Search**: Makes small changes to current solution (neighbor generation)
- **No Optimality Guarantee**: Finds good solutions quickly but doesn't prove optimality

### Phase 1: Greedy Initialization

**Purpose**: Generate a feasible initial solution quickly

**Algorithm**:
```
1. Sort courses by priority (larger groups, longer duration first)
2. For each course:
   a. Try each day and time slot
   b. Try each available instructor
   c. Try each suitable room
   d. If no conflicts, assign and mark resources as occupied
   e. If assigned, move to next course
3. Return initial solution (may have some unassigned courses)
```

**Time Complexity**: O(C × D × T × I × R) where:
- C = number of courses
- D = number of days (5)
- T = number of time slots (~20)
- I = instructors per course (~1-2)
- R = suitable rooms (~10-30)

**Typical Performance**: 1-5 seconds for 300 courses

### Phase 2: Simulated Annealing Optimization

**Purpose**: Improve the initial solution by exploring the solution space

**Algorithm**:
```
1. Initialize:
   - current_solution = greedy_solution
   - best_solution = current_solution
   - temperature = 2000 (high for exploration)
   - cooling_rate = 0.998 (slow cooling)

2. While temperature > min_temperature AND time_limit not reached:
   a. Generate neighbor solution (random perturbation)
   b. Evaluate fitness of neighbor
   c. Calculate delta = fitness(neighbor) - fitness(current)
   
   d. Accept neighbor if:
      - delta > 0 (neighbor is better), OR
      - random() < exp(delta / temperature) (probabilistic acceptance)
   
   e. If accepted and better than best:
      - Update best_solution
   
   f. Cool down: temperature *= cooling_rate
   g. Increment iteration

3. Return best_solution
```

**Acceptance Probability**:
```
P(accept worse solution) = exp(Δfitness / temperature)
```

Where:
- Δfitness < 0 (negative, since neighbor is worse)
- Higher temperature → Higher acceptance probability
- As temperature decreases → Less likely to accept worse solutions

**Parameters**:
- Initial temperature: 2000
- Cooling rate: 0.998 (slower = more iterations)
- Minimum temperature: 0.01
- Time limit: 300 seconds (default)

**Typical Performance**:
- 50 courses: 5-10 seconds, ~2000 iterations
- 100 courses: 10-20 seconds, ~3000 iterations
- 300 courses: 30-60 seconds, ~5000 iterations

### Neighbor Generation (Move Types)

The algorithm uses four types of moves to generate neighbor solutions:

#### Move 1: Change Time Slot (40% probability)
```
- Select random assignment
- Choose new day (prefer instructor's preferred days)
- Choose new time slot
- Update assignment if instructor is available
```

**Purpose**: Explore different scheduling times

#### Move 2: Swap Assignments (30% probability)
```
- Select two random assignments
- Swap their time slots (day + time)
- Keep other properties (instructor, room, group)
```

**Purpose**: Improve schedule compactness by rearranging

#### Move 3: Change Room (20% probability)
```
- Select random assignment
- Choose different suitable room
- Update assignment
```

**Purpose**: Optimize room utilization

#### Move 4: Compact Schedule (10% probability)
```
- Select random assignment
- Find other assignments for same instructor on same day
- Move assignment closer to one of them (before or after with 30-min gap)
```

**Purpose**: Reduce gaps in instructor schedules

### Fitness Evaluation

**Fitness Function** (higher is better):
```
fitness = 1000 - Σ(penalty for each violation)
```

**Constraint Penalties**:
- **Hard Constraints** (must be satisfied):
  - Room double-booking: -100 per conflict
  - Instructor double-booking: -100 per conflict
  - Student group double-booking: -100 per conflict
  - Room capacity exceeded: -50 per violation

- **Soft Constraints** (preferences):
  - Instructor preference violated: -weight (configurable 0-10)
  - Schedule not compact (gap > 2 hours): -weight × (gap_hours - 2)

**Fitness Range**: 0-1000
- 900-1000: Excellent (no hard violations, few soft violations)
- 700-900: Good (no hard violations, some soft violations)
- 500-700: Acceptable (no hard violations, many soft violations)
- < 500: Poor (may have hard violations)

### Constraint Handling

#### Hard Constraints (Rejection-based)

**Room Double-Booking**:
```typescript
// Check if room is already occupied at this time
const key = `${roomId}-${day}-${startTime}`;
if (roomSlots.has(key) && roomSlots.get(key).length > 1) {
  // Conflict detected
  penalty += 100;
}
```

**Instructor Double-Booking**:
```typescript
// Check if instructor is already teaching at this time
const key = `${instructorId}-${day}-${startTime}`;
if (instructorSlots.has(key) && instructorSlots.get(key).length > 1) {
  // Conflict detected
  penalty += 100;
}
```

**Student Group Double-Booking**:
```typescript
// Check if group has overlapping classes
const key = `${groupId}-${day}-${startTime}`;
if (groupSlots.has(key) && groupSlots.get(key).length > 1) {
  // Conflict detected
  penalty += 100;
}
```

**Room Capacity**:
```typescript
if (room.capacity < group.size) {
  penalty += 50;
}
```

**Instructor Availability**:
```typescript
// Check if time falls within any available range
for (const slot of instructor.availability[day]) {
  const [start, end] = slot.split('-');
  if (timeMinutes >= startMinutes && timeMinutes < endMinutes) {
    return true; // Available
  }
}
return false; // Not available
```

#### Soft Constraints (Penalty-based)

**Instructor Preferences**:
```typescript
if (preferredDays && !preferredDays.includes(assignment.day)) {
  penalty += weight; // Configurable weight (0-10)
}
```

**Schedule Compactness**:
```typescript
// Calculate gap between consecutive classes
const gap = nextStartTime - currentEndTime;
if (gap > 120) { // More than 2 hours
  penalty += weight * ((gap - 120) / 60);
}
```

### Advantages of Simulated Annealing

1. **Fast**: Generates solutions in seconds, not minutes
2. **Scalable**: Handles 300+ courses efficiently
3. **No External Dependencies**: Runs directly in Node.js
4. **Flexible**: Easy to add new constraint types
5. **Concurrent**: Multiple requests can run simultaneously
6. **Good Solutions**: Finds high-quality solutions quickly

### Disadvantages

1. **No Optimality Guarantee**: Cannot prove solution is optimal
2. **Randomness**: Different runs may produce different results
3. **Parameter Tuning**: Performance depends on temperature/cooling parameters
4. **Local Optima**: May get stuck in local optima

---

## Algorithm 2: Python OR-Tools Solver (Constraint Programming)

### Overview

The OR-Tools solver uses **Constraint Programming (CP-SAT)** to find optimal solutions. This is a more sophisticated approach that can prove optimality or infeasibility.

### Algorithm Type: Constraint Programming

Constraint Programming (CP) is a paradigm for solving combinatorial optimization problems. Unlike traditional optimization methods, CP:

- Explicitly models constraints as first-class citizens
- Uses constraint propagation to reduce search space
- Employs backtracking search with intelligent heuristics
- Can prove optimality or infeasibility

The **CP-SAT solver** is Google's state-of-the-art constraint programming solver, combining:
- Conflict-driven clause learning (CDCL) from SAT solvers
- Lazy clause generation
- Linear programming relaxations
- Parallel search

## Problem Formulation

### Decision Variables

For each possible assignment, we create a boolean decision variable:

```
x[c, d, s, r, i, g] ∈ {0, 1}
```

Where:
- `c` = course ID
- `d` = day (MONDAY-FRIDAY)
- `s` = time slot index
- `r` = room ID
- `i` = instructor ID
- `g` = student group ID

`x[c, d, s, r, i, g] = 1` means course `c` is assigned to:
- Day `d`
- Time slot `s`
- Room `r`
- Instructor `i`
- Student group `g`

### Time Slot Grid

Time slots are generated based on:
- Working hours (e.g., 08:00-18:00)
- Minimum course duration
- Course duration requirements

Example for 90-minute courses with 08:00-18:00 working hours:
```
Slot 0: 08:00-09:30
Slot 1: 09:30-11:00
Slot 2: 11:00-12:30
Slot 3: 12:30-14:00
Slot 4: 14:00-15:30
Slot 5: 15:30-17:00
```

## Constraints

### Hard Constraints (Must Be Satisfied)

#### 1. Course Assignment Constraint

Each course must be assigned exactly once:

```
∀c ∈ Courses: Σ(d,s,r,i,g) x[c,d,s,r,i,g] = 1
```

**Implementation:**
```python
for course in courses:
    course_vars = get_assignment_vars_for_course(course.id)
    model.Add(sum(course_vars) == 1)
```

#### 2. Room Conflict Constraint

No room can be double-booked (considering course duration):

```
∀r ∈ Rooms, ∀d ∈ Days, ∀s ∈ TimeSlots:
  Σ(c,i,g | course c overlaps slot s) x[c,d,s,r,i,g] ≤ 1
```

**Implementation:**
```python
for room in rooms:
    for day in days:
        for slot_idx in time_slots:
            conflicting_vars = []
            for assignment_var in all_vars:
                if overlaps(assignment_var, room, day, slot_idx):
                    conflicting_vars.append(assignment_var)
            if len(conflicting_vars) > 1:
                model.Add(sum(conflicting_vars) <= 1)
```

**Overlap Logic:**
A course starting at slot `s` with duration `d` occupies slots `[s, s+1, ..., s+d-1]`.

#### 3. Instructor Conflict Constraint

No instructor can teach multiple courses simultaneously:

```
∀i ∈ Instructors, ∀d ∈ Days, ∀s ∈ TimeSlots:
  Σ(c,r,g | course c overlaps slot s) x[c,d,s,r,i,g] ≤ 1
```

#### 4. Student Group Conflict Constraint

No student group can attend multiple courses simultaneously:

```
∀g ∈ Groups, ∀d ∈ Days, ∀s ∈ TimeSlots:
  Σ(c,r,i | course c overlaps slot s) x[c,d,s,r,i,g] ≤ 1
```

#### 5. Room Capacity Constraint

Room capacity must be sufficient for the student group:

```
∀c,d,s,r,i,g: if group[g].size > room[r].capacity then x[c,d,s,r,i,g] = 0
```

**Implementation:**
```python
for assignment_var in all_vars:
    if group.size > room.capacity:
        model.Add(assignment_var == 0)
```

#### 6. Room Type Constraint

Room type must match course requirements:

```
∀c,d,s,r,i,g: if course[c].room_type ≠ room[r].type then x[c,d,s,r,i,g] = 0
```

#### 7. Instructor Availability Constraint

Instructors can only be assigned during their available times:

```
∀c,d,s,r,i,g: if slot s not in instructor[i].availability[d] then x[c,d,s,r,i,g] = 0
```

**Implementation:**
```python
for instructor in instructors:
    for day in days:
        available_ranges = instructor.availability.get(day, [])
        for slot_idx, (slot_start, slot_end) in enumerate(time_slots):
            if not is_available(slot_start, available_ranges):
                # Block all assignments for this instructor at this time
                for assignment_var in get_vars_for_instructor_slot(instructor.id, day, slot_idx):
                    model.Add(assignment_var == 0)
```

#### 8. Working Hours Constraint

All assignments must be within working hours (handled during variable creation).

### Soft Constraints (Preferences to Optimize)

Soft constraints are modeled as penalty variables that contribute to the objective function.

#### 1. Instructor Time Preferences

Penalty for assigning instructors outside their preferred days/times:

```
penalty_pref[i,d,s] = 1 if instructor i assigned on non-preferred day d or time s
Penalty = Σ(i,d,s) penalty_pref[i,d,s] × weight_pref
```

**Weight:** `instructorPreferencesWeight` (default: 5)

**Implementation:**
```python
for assignment_var in all_vars:
    if not is_preferred(instructor, day, time):
        penalty_var = model.NewBoolVar(f"penalty_pref_{instructor}_{day}_{time}")
        model.Add(penalty_var == assignment_var)
        penalty_vars.append((penalty_var, weight * 10))
```

#### 2. Schedule Compactness

Penalty for gaps in student group schedules:

```
gap[g,d,s] = 1 if group g has classes before and after slot s, but not at slot s
Penalty = Σ(g,d,s) gap[g,d,s] × weight_compact
```

**Weight:** `compactSchedulesWeight` (default: 7)

**Goal:** Minimize idle time between classes for students.

**Implementation:**
```python
for group in groups:
    for day in days:
        for slot_idx in range(len(time_slots) - 2):
            # Check for gap: class at slot_idx, no class at slot_idx+1, class at slot_idx+2
            start_vars = get_vars_for_group_slot(group, day, slot_idx)
            middle_vars = get_vars_for_group_slot(group, day, slot_idx + 1)
            end_vars = get_vars_for_group_slot(group, day, slot_idx + 2)
            
            for start_var in start_vars:
                for end_var in end_vars:
                    gap_penalty = model.NewBoolVar(f"gap_{group}_{day}_{slot_idx}")
                    # gap_penalty = 1 if start_var = 1 AND end_var = 1 AND sum(middle_vars) = 0
                    model.Add(gap_penalty >= start_var + end_var - 1 - sum(middle_vars))
                    penalty_vars.append((gap_penalty, weight * 10))
```

#### 3. Balanced Daily Load

Penalty for unbalanced distribution of classes across days:

```
diff[i,d1,d2] = |count[i,d1] - count[i,d2]|
Penalty = Σ(i,d1,d2) diff[i,d1,d2] × weight_balanced
```

**Weight:** `balancedDailyLoadWeight` (default: 6)

**Goal:** Distribute instructor workload evenly across the week.

**Implementation:**
```python
for instructor in instructors:
    daily_counts = {}
    for day in days:
        day_var = model.NewIntVar(0, 100, f"count_{instructor}_{day}")
        day_assignments = get_vars_for_instructor_day(instructor, day)
        model.Add(day_var == sum(day_assignments))
        daily_counts[day] = day_var
    
    # Penalize differences between days
    for day1, day2 in combinations(daily_counts.keys(), 2):
        diff = model.NewIntVar(0, 100, f"diff_{instructor}_{day1}_{day2}")
        model.AddAbsEquality(diff, daily_counts[day1] - daily_counts[day2])
        penalty_vars.append((diff, weight * 2))
```

#### 4. Room Preference

Penalty for using oversized rooms:

```
penalty_room[c,r,g] = 1 if room[r].capacity > 1.5 × group[g].size
Penalty = Σ(c,r,g) penalty_room[c,r,g] × weight_room
```

**Weight:** `preferredRoomsWeight` (default: 3)

**Goal:** Use appropriately sized rooms to maximize utilization.

## Objective Function

The objective is to minimize the total weighted penalty:

```
Minimize: Σ(all penalty variables) penalty_var × weight
```

**Implementation:**
```python
objective_terms = [var * weight for var, weight in penalty_vars]
model.Minimize(sum(objective_terms))
```

## Solver Configuration

### Parameters

```python
solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 300  # 5 minutes default
solver.parameters.num_search_workers = 8     # Parallel search
solver.parameters.log_search_progress = True
solver.parameters.cp_model_presolve = True
solver.parameters.cp_model_probing_level = 2
```

**Key Parameters:**
- `max_time_in_seconds`: Time limit for solving (10-600 seconds)
- `num_search_workers`: Number of parallel threads (default: 8)
- `log_search_progress`: Enable progress logging
- `cp_model_presolve`: Enable preprocessing to simplify model
- `cp_model_probing_level`: Constraint propagation level (0-3)

### Solver Status

The solver can return several statuses:

1. **OPTIMAL**: Found and proved optimal solution
2. **FEASIBLE**: Found a solution but not proven optimal (time limit reached)
3. **INFEASIBLE**: No solution exists (constraints are too restrictive)
4. **MODEL_INVALID**: Model has errors
5. **UNKNOWN**: Unable to solve (timeout or too complex)

## Solution Extraction

After solving, we extract the solution:

```python
assignments = []
for key, var in assignment_vars.items():
    if solver.Value(var) == 1:
        c_id, day, slot_idx, r_id, i_id, g_id = key
        slot_start, _ = time_slots[slot_idx]
        course = courses[c_id]
        
        # Calculate end time
        start_minutes = time_to_minutes(slot_start)
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
```

## Fitness Score Calculation

The fitness score represents solution quality (0-100, lower is better):

```python
fitness_score = (total_penalty / max_possible_penalty) × 100
```

Where:
- `total_penalty` = solver.ObjectiveValue()
- `max_possible_penalty` = sum of all penalty weights

**Interpretation:**
- 0-10: Excellent (most preferences satisfied)
- 10-30: Good (some preference violations)
- 30-50: Acceptable (many preference violations)
- 50+: Poor (significant preference violations)

## Infeasibility Analysis

When no solution exists, the solver analyzes potential causes:

### 1. Insufficient Capacity

```python
total_courses = len(courses)
total_slots = len(rooms) × len(time_slots) × len(days)

if total_courses > total_slots:
    return "Not enough room-time slots"
```

### 2. Room Capacity Issues

```python
for course in courses:
    for group in course.groups:
        suitable_rooms = [r for r in rooms if r.capacity >= group.size]
        if not suitable_rooms:
            return f"No room with capacity for group {group.name}"
```

### 3. Room Type Mismatches

```python
for course in courses:
    if course.room_type:
        matching_rooms = [r for r in rooms if r.type == course.room_type]
        if not matching_rooms:
            return f"No room of type {course.room_type}"
```

### 4. Instructor Availability

```python
for instructor in instructors:
    total_available_hours = calculate_available_hours(instructor)
    required_hours = sum(c.duration for c in instructor.courses) / 60
    
    if required_hours > total_available_hours:
        return f"Instructor {instructor.name} needs {required_hours}h but only has {total_available_hours}h"
```

## Performance Characteristics

### Time Complexity

The timetable scheduling problem is **NP-hard**. Worst-case complexity is exponential in the number of variables.

**Practical Performance:**
- 50 courses: < 10 seconds
- 100 courses: 10-30 seconds
- 200 courses: 30-90 seconds
- 500 courses: 90-300 seconds
- 1000+ courses: 300+ seconds (may require longer time limits)

### Space Complexity

**Decision Variables:**
```
V = C × D × S × R × I × G
```

Where:
- C = number of courses
- D = number of days (typically 5)
- S = number of time slots per day (typically 6-10)
- R = number of rooms
- I = average instructors per course
- G = average groups per course

**Example:**
- 100 courses
- 5 days
- 8 time slots
- 30 rooms
- 1.5 avg instructors per course
- 2 avg groups per course

```
V = 100 × 5 × 8 × 30 × 1.5 × 2 = 360,000 variables
```

The CP-SAT solver uses advanced techniques to handle large variable spaces efficiently.

### Optimization Strategies

#### 1. Variable Reduction

Only create variables for valid assignments:
- Skip slots where course doesn't fit
- Skip rooms with insufficient capacity
- Skip rooms with wrong type
- Skip unavailable instructor times

This can reduce variables by 50-80%.

#### 2. Constraint Propagation

The solver uses constraint propagation to:
- Eliminate impossible values
- Detect conflicts early
- Reduce search space

#### 3. Parallel Search

Multiple search workers explore different parts of the search space simultaneously.

#### 4. Heuristics

The solver uses intelligent heuristics to:
- Choose which variable to assign next
- Choose which value to try first
- Detect and learn from conflicts

## Algorithm Pseudocode

```
function optimize_timetable(payload):
    # 1. Initialize
    optimizer = TimetableOptimizer(payload)
    
    # 2. Create decision variables
    for each course c:
        for each day d:
            for each time slot s:
                for each room r:
                    for each instructor i in c.instructors:
                        for each group g in c.groups:
                            if valid_assignment(c, d, s, r, i, g):
                                create variable x[c,d,s,r,i,g]
    
    # 3. Add hard constraints
    add_course_assignment_constraints()
    add_room_conflict_constraints()
    add_instructor_conflict_constraints()
    add_group_conflict_constraints()
    add_capacity_constraints()
    add_room_type_constraints()
    add_availability_constraints()
    
    # 4. Add soft constraints with penalties
    add_instructor_preference_penalties()
    add_compactness_penalties()
    add_balanced_load_penalties()
    add_room_preference_penalties()
    
    # 5. Set objective
    minimize(sum of all penalty variables × weights)
    
    # 6. Solve
    solver = CpSolver()
    configure_solver_parameters()
    status = solver.Solve(model)
    
    # 7. Extract solution
    if status in [OPTIMAL, FEASIBLE]:
        assignments = extract_assignments(solver)
        fitness_score = calculate_fitness(solver)
        violations = identify_violations(solver, assignments)
        return success, assignments, fitness_score, violations
    else:
        analyze_infeasibility()
        return failure, [], null, []
```

## Solver Comparison

### Local Solver vs OR-Tools Solver

| Feature | Local Solver (Simulated Annealing) | OR-Tools Solver (CP-SAT) |
|---------|-------------------------------------|--------------------------|
| **Speed** | Fast (10-60 seconds) | Slower (30-300 seconds) |
| **Optimality** | No guarantee | Can prove optimality |
| **Scalability** | Excellent (300+ courses) | Good (2000+ courses) |
| **Deployment** | Runs in web app | Separate microservice |
| **Dependencies** | None (TypeScript) | Python, OR-Tools |
| **Concurrency** | High (multiple instances) | Limited (resource intensive) |
| **Solution Quality** | Good (90-95% optimal) | Optimal or proven infeasible |
| **Infeasibility Detection** | Heuristic | Exact with conflict analysis |
| **Constraint Flexibility** | Easy to modify | Requires model changes |
| **Recommended For** | Most use cases | Complex constraints, proof needed |

### When to Use Each Solver

**Use Local Solver (Default) When:**
- You need fast results (< 1 minute)
- You have 50-300 courses
- Good-enough solutions are acceptable
- You want to avoid external dependencies
- You need high concurrency

**Use OR-Tools Solver When:**
- You need proven optimal solutions
- You have very complex constraints
- You need infeasibility analysis
- You have 500+ courses
- Solution quality is more important than speed

### Comparison with Other Approaches

#### vs. Pure Greedy Algorithms

**Greedy:**
- Fast (seconds)
- No optimization
- May fail to find solution even if one exists
- Simple to implement

**Local Solver:**
- Fast (seconds to minutes)
- Optimizes through annealing
- Usually finds good solutions
- Moderate complexity

**OR-Tools:**
- Slower (minutes)
- Proves optimality
- Finds solution if one exists
- Complex implementation

#### vs. Genetic Algorithms

**Genetic:**
- Medium speed
- No optimality guarantee
- Good for soft constraints
- May violate hard constraints
- Population-based

**Local Solver:**
- Similar speed
- No optimality guarantee
- Handles both hard and soft constraints
- Rejection-based for hard constraints
- Single-solution based

**OR-Tools:**
- Slower
- Can prove optimality
- Guarantees hard constraint satisfaction
- Optimizes soft constraints
- Deterministic

#### vs. Integer Linear Programming (ILP)

**ILP:**
- Good for linear objectives
- Requires linearization of constraints
- May struggle with logical constraints
- Proven optimal solutions

**Local Solver:**
- Handles non-linear objectives naturally
- Easy to express logical constraints
- No optimality proof
- Faster for large problems

**OR-Tools:**
- Natural expression of logical constraints
- Combines CP and LP techniques
- Better for scheduling problems
- More flexible constraint types

## References

1. Google OR-Tools Documentation: https://developers.google.com/optimization
2. CP-SAT Solver: https://github.com/google/or-tools
3. Constraint Programming: Handbook of Constraint Programming (Rossi, van Beek, Walsh)
4. University Timetabling: A Survey (Schaerf, 1999)
