/**
 * Local TypeScript-based Timetable Solver
 * Uses Simulated Annealing with Greedy initialization
 * Handles large datasets efficiently and supports concurrent requests
 */

import type {
  CourseInput,
  InstructorInput,
  RoomInput,
  StudentGroupInput,
  ConstraintConfigInput,
  AssignmentOutput,
  ViolationDetail,
  Day,
} from './solver-client';

// Time slots (8 AM to 6 PM in 30-minute intervals)
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

const DAYS: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

interface Assignment {
  courseId: number;
  instructorId: number;
  roomId: number;
  groupId: number;
  day: Day;
  startTime: string;
  endTime: string;
}

interface Conflict {
  type: string;
  severity: 'HARD' | 'SOFT';
  description: string;
  penalty: number;
  assignmentIndices: number[];
}

class TimetableSolver {
  private courses: CourseInput[];
  private instructors: Map<number, InstructorInput>;
  private rooms: Map<number, RoomInput>;
  private groups: Map<number, StudentGroupInput>;
  private constraints: ConstraintConfigInput;
  
  constructor(
    courses: CourseInput[],
    instructors: InstructorInput[],
    rooms: RoomInput[],
    groups: StudentGroupInput[],
    constraints: ConstraintConfigInput
  ) {
    this.courses = courses;
    this.instructors = new Map(instructors.map(i => [i.id, i]));
    this.rooms = new Map(rooms.map(r => [r.id, r]));
    this.groups = new Map(groups.map(g => [g.id, g]));
    this.constraints = constraints;
  }

  /**
   * Main solve method using Greedy + Simulated Annealing
   */
  async solve(timeLimitSeconds: number = 300): Promise<{
    assignments: Assignment[];
    fitness: number;
    violations: Conflict[];
  }> {
    const startTime = Date.now();
    const timeLimitMs = timeLimitSeconds * 1000;

    // Phase 1: Greedy initialization
    console.log('Phase 1: Greedy initialization...');
    let currentSolution = this.greedyInitialization();
    let currentFitness = this.evaluateFitness(currentSolution);
    
    let bestSolution = [...currentSolution];
    let bestFitness = currentFitness;

    // Phase 2: Simulated Annealing
    console.log('Phase 2: Simulated Annealing optimization...');
    const temperature = 2000; // Higher initial temperature for more exploration
    const coolingRate = 0.998; // Slower cooling for more iterations
    const minTemperature = 0.01;
    
    let temp = temperature;
    let iteration = 0;
    let acceptedMoves = 0;
    let rejectedMoves = 0;

    while (temp > minTemperature && (Date.now() - startTime) < timeLimitMs * 0.9) {
      // Generate neighbor solution
      const neighbor = this.generateNeighbor(currentSolution);
      
      // Quick check: reject if neighbor has hard constraint violations and current doesn't
      const neighborViolations = this.detectViolations(neighbor);
      const currentViolations = this.detectViolations(currentSolution);
      const neighborHardViolations = neighborViolations.filter(v => v.severity === 'HARD').length;
      const currentHardViolations = currentViolations.filter(v => v.severity === 'HARD').length;
      
      // Never accept a solution with more hard violations
      if (neighborHardViolations > currentHardViolations) {
        rejectedMoves++;
        temp *= coolingRate;
        iteration++;
        continue;
      }
      
      const neighborFitness = this.evaluateFitness(neighbor);

      // Accept or reject neighbor
      const delta = neighborFitness - currentFitness;
      
      if (delta > 0 || Math.random() < Math.exp(delta / temp)) {
        currentSolution = neighbor;
        currentFitness = neighborFitness;
        acceptedMoves++;

        // Update best solution
        if (currentFitness > bestFitness) {
          bestSolution = [...currentSolution];
          bestFitness = currentFitness;
          const hardViolations = neighborViolations.filter(v => v.severity === 'HARD').length;
          const softViolations = neighborViolations.filter(v => v.severity === 'SOFT').length;
          console.log(`✨ New best fitness: ${bestFitness.toFixed(2)} (Hard: ${hardViolations}, Soft: ${softViolations}) at iteration ${iteration}`);
        }
      } else {
        rejectedMoves++;
      }

      temp *= coolingRate;
      iteration++;

      // Log progress every 500 iterations
      if (iteration % 500 === 0) {
        const acceptanceRate = (acceptedMoves / (acceptedMoves + rejectedMoves) * 100).toFixed(1);
        console.log(`Iteration ${iteration}: Best = ${bestFitness.toFixed(2)}, Current = ${currentFitness.toFixed(2)}, Temp = ${temp.toFixed(2)}, Accept rate = ${acceptanceRate}%`);
        acceptedMoves = 0;
        rejectedMoves = 0;
      }
    }

    console.log(`Completed ${iteration} iterations in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.log(`Best fitness: ${bestFitness.toFixed(2)}`);

    const violations = this.detectViolations(bestSolution);
    
    return {
      assignments: bestSolution,
      fitness: bestFitness,
      violations,
    };
  }

  /**
   * Greedy initialization - assigns courses to first available slots
   */
  private greedyInitialization(): Assignment[] {
    const assignments: Assignment[] = [];
    const occupiedSlots = new Map<string, Set<number>>(); // key: "day-time", value: Set of resource IDs

    // Sort courses by priority (larger groups, longer duration first)
    const sortedCourses = [...this.courses].sort((a, b) => {
      const aMaxGroup = Math.max(...a.group_ids.map(gid => this.groups.get(gid)?.size || 0));
      const bMaxGroup = Math.max(...b.group_ids.map(gid => this.groups.get(gid)?.size || 0));
      if (aMaxGroup !== bMaxGroup) return bMaxGroup - aMaxGroup;
      return b.duration - a.duration;
    });

    for (const course of sortedCourses) {
      for (const groupId of course.group_ids) {
        const group = this.groups.get(groupId);
        if (!group) continue;

        let assigned = false;

        // Try each day and time slot
        for (const day of DAYS) {
          if (assigned) break;
          
          for (const startTime of TIME_SLOTS) {
            if (assigned) break;

            const endTime = this.calculateEndTime(startTime, course.duration);
            if (!endTime) continue;

            // Try each instructor
            for (const instructorId of course.instructor_ids) {
              if (assigned) break;
              const instructor = this.instructors.get(instructorId);
              if (!instructor || !this.isInstructorAvailable(instructor, day, startTime)) continue;

              // Try each room
              const suitableRooms = this.getSuitableRooms(course, group.size);
              for (const room of suitableRooms) {
                // Check if there's any overlap for the entire duration
                if (!this.hasOverlap(day, startTime, course.duration, instructorId, room.id, groupId, occupiedSlots)) {
                  // Assign
                  assignments.push({
                    courseId: course.id,
                    instructorId,
                    roomId: room.id,
                    groupId,
                    day,
                    startTime,
                    endTime,
                  });

                  // Mark all time slots as occupied
                  this.markSlotOccupied(`${day}-${startTime}`, instructorId, room.id, groupId, occupiedSlots, course.duration);
                  
                  assigned = true;
                  break;
                }
              }
            }
          }
        }

        if (!assigned) {
          console.warn(`Could not assign course ${course.code} for group ${group.name}`);
        }
      }
    }

    return assignments;
  }

  /**
   * Generate a neighbor solution by making a small random change
   */
  private generateNeighbor(solution: Assignment[]): Assignment[] {
    if (solution.length === 0) return solution;

    const neighbor = [...solution];
    const moveType = Math.random();

    if (moveType < 0.4) {
      // Move 1: Change time slot (prefer instructor's preferred times)
      const idx = Math.floor(Math.random() * neighbor.length);
      const assignment = neighbor[idx];
      const instructor = this.instructors.get(assignment.instructorId);
      
      // Try to use instructor's preferred days if available
      let newDay: Day;
      if (instructor?.preferences?.preferredDays && Math.random() < 0.7) {
        const preferredDays = instructor.preferences.preferredDays as Day[];
        newDay = preferredDays[Math.floor(Math.random() * preferredDays.length)];
      } else {
        newDay = DAYS[Math.floor(Math.random() * DAYS.length)];
      }
      
      const newStartTime = TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
      const newEndTime = this.calculateEndTime(newStartTime, this.getCourse(assignment.courseId)?.duration || 90);
      
      if (newEndTime && this.isInstructorAvailable(instructor!, newDay, newStartTime)) {
        neighbor[idx] = { ...assignment, day: newDay, startTime: newStartTime, endTime: newEndTime };
      }
    } else if (moveType < 0.7) {
      // Move 2: Swap two assignments (helps with compactness)
      if (neighbor.length >= 2) {
        const idx1 = Math.floor(Math.random() * neighbor.length);
        let idx2 = Math.floor(Math.random() * neighbor.length);
        while (idx2 === idx1 && neighbor.length > 1) {
          idx2 = Math.floor(Math.random() * neighbor.length);
        }
        
        // Swap time slots but keep other properties
        const temp = {
          day: neighbor[idx1].day,
          startTime: neighbor[idx1].startTime,
          endTime: neighbor[idx1].endTime,
        };
        neighbor[idx1] = { ...neighbor[idx1], ...{ day: neighbor[idx2].day, startTime: neighbor[idx2].startTime, endTime: neighbor[idx2].endTime } };
        neighbor[idx2] = { ...neighbor[idx2], ...temp };
      }
    } else if (moveType < 0.9) {
      // Move 3: Change room
      const idx = Math.floor(Math.random() * neighbor.length);
      const assignment = neighbor[idx];
      const course = this.getCourse(assignment.courseId);
      const group = this.groups.get(assignment.groupId);
      
      if (course && group) {
        const suitableRooms = this.getSuitableRooms(course, group.size);
        if (suitableRooms.length > 0) {
          const newRoom = suitableRooms[Math.floor(Math.random() * suitableRooms.length)];
          neighbor[idx] = { ...assignment, roomId: newRoom.id };
        }
      }
    } else {
      // Move 4: Compact schedule - move assignment closer to another on same day
      const idx = Math.floor(Math.random() * neighbor.length);
      const assignment = neighbor[idx];
      
      // Find other assignments for same instructor on same day
      const sameInstructorSameDay = neighbor.filter(
        (a, i) => i !== idx && a.instructorId === assignment.instructorId && a.day === assignment.day
      );
      
      if (sameInstructorSameDay.length > 0) {
        // Try to move closer to one of them
        const target = sameInstructorSameDay[Math.floor(Math.random() * sameInstructorSameDay.length)];
        const targetTime = this.timeToMinutes(target.startTime);
        const duration = this.getCourse(assignment.courseId)?.duration || 90;
        
        // Try before or after
        const newStartMinutes = Math.random() < 0.5 
          ? targetTime - duration - 30  // 30 min gap before
          : this.timeToMinutes(target.endTime) + 30; // 30 min gap after
        
        if (newStartMinutes >= this.timeToMinutes('08:00') && newStartMinutes <= this.timeToMinutes('17:00')) {
          const hours = Math.floor(newStartMinutes / 60);
          const mins = newStartMinutes % 60;
          const newStartTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
          const newEndTime = this.calculateEndTime(newStartTime, duration);
          
          if (newEndTime) {
            neighbor[idx] = { ...assignment, startTime: newStartTime, endTime: newEndTime };
          }
        }
      }
    }

    return neighbor;
  }

  /**
   * Evaluate fitness of a solution (higher is better)
   */
  private evaluateFitness(solution: Assignment[]): number {
    let fitness = 1000; // Start with base score
    const conflicts = this.detectViolations(solution);

    for (const conflict of conflicts) {
      fitness -= conflict.penalty;
    }

    return Math.max(0, fitness);
  }

  /**
   * Detect all constraint violations
   */
  private detectViolations(solution: Assignment[]): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check hard constraints
    if (this.constraints.hard.noRoomDoubleBooking) {
      conflicts.push(...this.checkRoomConflicts(solution));
    }
    
    if (this.constraints.hard.noInstructorDoubleBooking) {
      conflicts.push(...this.checkInstructorConflicts(solution));
    }
    
    // Check student group conflicts (hard constraint)
    conflicts.push(...this.checkStudentGroupConflicts(solution));
    
    if (this.constraints.hard.roomCapacityCheck) {
      conflicts.push(...this.checkRoomCapacity(solution));
    }

    // Check soft constraints (only if weights > 0)
    if (this.constraints.soft.instructorPreferences > 0) {
      conflicts.push(...this.checkInstructorPreferences(solution));
    }
    
    if (this.constraints.soft.compactSchedules > 0) {
      conflicts.push(...this.checkCompactSchedules(solution));
    }

    return conflicts;
  }

  /**
   * Check for room double-booking conflicts
   */
  private checkRoomConflicts(solution: Assignment[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const roomSlots = new Map<string, number[]>(); // key: "roomId-day-time", value: assignment indices

    solution.forEach((assignment, idx) => {
      const key = `${assignment.roomId}-${assignment.day}-${assignment.startTime}`;
      if (!roomSlots.has(key)) {
        roomSlots.set(key, []);
      }
      roomSlots.get(key)!.push(idx);
    });

    for (const [key, indices] of roomSlots.entries()) {
      if (indices.length > 1) {
        const [roomId] = key.split('-');
        const room = this.rooms.get(parseInt(roomId));
        conflicts.push({
          type: 'ROOM_DOUBLE_BOOKING',
          severity: 'HARD',
          description: `Room ${room?.name || roomId} is double-booked`,
          penalty: 100,
          assignmentIndices: indices,
        });
      }
    }

    return conflicts;
  }

  /**
   * Check for instructor double-booking conflicts
   */
  private checkInstructorConflicts(solution: Assignment[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const instructorSlots = new Map<string, number[]>();

    solution.forEach((assignment, idx) => {
      const key = `${assignment.instructorId}-${assignment.day}-${assignment.startTime}`;
      if (!instructorSlots.has(key)) {
        instructorSlots.set(key, []);
      }
      instructorSlots.get(key)!.push(idx);
    });

    for (const [key, indices] of instructorSlots.entries()) {
      if (indices.length > 1) {
        const [instructorId] = key.split('-');
        const instructor = this.instructors.get(parseInt(instructorId));
        conflicts.push({
          type: 'INSTRUCTOR_DOUBLE_BOOKING',
          severity: 'HARD',
          description: `Instructor ${instructor?.name || instructorId} is double-booked`,
          penalty: 100,
          assignmentIndices: indices,
        });
      }
    }

    return conflicts;
  }

  /**
   * Check for student group double-booking conflicts
   */
  private checkStudentGroupConflicts(solution: Assignment[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const groupSlots = new Map<string, number[]>();

    solution.forEach((assignment, idx) => {
      const key = `${assignment.groupId}-${assignment.day}-${assignment.startTime}`;
      if (!groupSlots.has(key)) {
        groupSlots.set(key, []);
      }
      groupSlots.get(key)!.push(idx);
    });

    for (const [key, indices] of groupSlots.entries()) {
      if (indices.length > 1) {
        const [groupId] = key.split('-');
        const group = this.groups.get(parseInt(groupId));
        conflicts.push({
          type: 'GROUP_DOUBLE_BOOKING',
          severity: 'HARD',
          description: `Student group ${group?.name || groupId} has overlapping classes`,
          penalty: 100,
          assignmentIndices: indices,
        });
      }
    }

    return conflicts;
  }

  /**
   * Check room capacity constraints
   */
  private checkRoomCapacity(solution: Assignment[]): Conflict[] {
    const conflicts: Conflict[] = [];

    solution.forEach((assignment, idx) => {
      const room = this.rooms.get(assignment.roomId);
      const group = this.groups.get(assignment.groupId);
      
      if (room && group && room.capacity < group.size) {
        conflicts.push({
          type: 'ROOM_CAPACITY_EXCEEDED',
          severity: 'HARD',
          description: `Room ${room.name} (capacity ${room.capacity}) cannot fit group ${group.name} (size ${group.size})`,
          penalty: 50,
          assignmentIndices: [idx],
        });
      }
    });

    return conflicts;
  }

  /**
   * Check instructor preferences (soft constraint)
   */
  private checkInstructorPreferences(solution: Assignment[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const weight = this.constraints.soft.instructorPreferences || 0;

    if (weight === 0) return conflicts;

    solution.forEach((assignment, idx) => {
      const instructor = this.instructors.get(assignment.instructorId);
      if (!instructor?.preferences) return;

      const preferredDays = instructor.preferences.preferredDays as Day[] | undefined;
      if (preferredDays && !preferredDays.includes(assignment.day)) {
        conflicts.push({
          type: 'INSTRUCTOR_PREFERENCE_VIOLATED',
          severity: 'SOFT',
          description: `Instructor ${instructor.name} prefers not to teach on ${assignment.day}`,
          penalty: weight,
          assignmentIndices: [idx],
        });
      }
    });

    return conflicts;
  }

  /**
   * Check for compact schedules (soft constraint)
   */
  private checkCompactSchedules(solution: Assignment[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const weight = this.constraints.soft.compactSchedules || 0;

    if (weight === 0) return conflicts;

    // Group assignments by instructor and day
    const instructorDayAssignments = new Map<string, Assignment[]>();
    
    solution.forEach(assignment => {
      const key = `${assignment.instructorId}-${assignment.day}`;
      if (!instructorDayAssignments.has(key)) {
        instructorDayAssignments.set(key, []);
      }
      instructorDayAssignments.get(key)!.push(assignment);
    });

    // Check for gaps in schedule (only penalize very large gaps)
    for (const [key, assignments] of instructorDayAssignments.entries()) {
      if (assignments.length < 2) continue;

      const sorted = assignments.sort((a, b) => 
        this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
      );

      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = this.timeToMinutes(sorted[i + 1].startTime) - this.timeToMinutes(sorted[i].endTime);
        
        // Only penalize gaps larger than 2 hours (lunch break is acceptable)
        if (gap > 120) {
          const [instructorId] = key.split('-');
          const instructor = this.instructors.get(parseInt(instructorId));
          conflicts.push({
            type: 'SCHEDULE_NOT_COMPACT',
            severity: 'SOFT',
            description: `${instructor?.name || 'Instructor'} has ${Math.floor(gap / 60)}h gap between classes`,
            penalty: weight * ((gap - 120) / 60), // Only penalize time beyond 2 hours
            assignmentIndices: [],
          });
        }
      }
    }

    return conflicts;
  }

  // Helper methods
  
  private getCourse(courseId: number): CourseInput | undefined {
    return this.courses.find(c => c.id === courseId);
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string | null {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    
    if (endMinutes > this.timeToMinutes('18:00')) return null;
    
    const hours = Math.floor(endMinutes / 60);
    const minutes = endMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private isInstructorAvailable(instructor: InstructorInput, day: Day, time: string): boolean {
    const availability = instructor.availability[day];
    if (!availability) return false;

    const timeMinutes = this.timeToMinutes(time);
    
    for (const slot of availability) {
      const [start, end] = slot.split('-');
      const startMinutes = this.timeToMinutes(start);
      const endMinutes = this.timeToMinutes(end);
      
      if (timeMinutes >= startMinutes && timeMinutes < endMinutes) {
        return true;
      }
    }
    
    return false;
  }

  private getSuitableRooms(course: CourseInput, groupSize: number): RoomInput[] {
    return Array.from(this.rooms.values()).filter(room => {
      if (room.capacity < groupSize) return false;
      if (course.room_type && room.type !== course.room_type) return false;
      return true;
    });
  }

  private isSlotFree(
    slotKey: string,
    instructorId: number,
    roomId: number,
    groupId: number,
    occupiedSlots: Map<string, Set<number>>
  ): boolean {
    const occupied = occupiedSlots.get(slotKey);
    if (!occupied) return true;
    
    // Check if ANY of the resources are already occupied
    // This prevents double-booking of instructors, rooms, or groups
    return !occupied.has(instructorId) && !occupied.has(roomId) && !occupied.has(groupId);
  }

  /**
   * Check if a time slot overlaps with any occupied slots for the given resources
   */
  private hasOverlap(
    day: string,
    startTime: string,
    duration: number,
    instructorId: number,
    roomId: number,
    groupId: number,
    occupiedSlots: Map<string, Set<number>>
  ): boolean {
    const startMinutes = this.timeToMinutes(startTime);
    
    // Check all 30-minute intervals covered by this assignment
    for (let offset = 0; offset < duration; offset += 30) {
      const currentMinutes = startMinutes + offset;
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      const currentTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      const key = `${day}-${currentTime}`;
      
      if (!this.isSlotFree(key, instructorId, roomId, groupId, occupiedSlots)) {
        return true; // Overlap detected
      }
    }
    
    return false; // No overlap
  }

  private markSlotOccupied(
    slotKey: string,
    instructorId: number,
    roomId: number,
    groupId: number,
    occupiedSlots: Map<string, Set<number>>,
    duration: number
  ): void {
    const [day, startTime] = slotKey.split('-');
    const startMinutes = this.timeToMinutes(startTime);
    
    // Mark all time slots covered by this assignment
    for (let offset = 0; offset < duration; offset += 30) {
      const currentMinutes = startMinutes + offset;
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      const currentTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      const key = `${day}-${currentTime}`;
      
      if (!occupiedSlots.has(key)) {
        occupiedSlots.set(key, new Set());
      }
      
      const set = occupiedSlots.get(key)!;
      set.add(instructorId);
      set.add(roomId);
      set.add(groupId);
    }
  }
}

export { TimetableSolver };
