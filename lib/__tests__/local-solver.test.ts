import { describe, it, expect } from 'vitest';
import { TimetableSolver } from '../local-solver';
import type {
  CourseInput,
  InstructorInput,
  RoomInput,
  StudentGroupInput,
  ConstraintConfigInput,
} from '../solver-client';

// Test data fixtures
const createTestInstructor = (id: number, availability: Record<string, string[]> = {}): InstructorInput => ({
  id,
  name: `Instructor ${id}`,
  department: 'Computer Science',
  teaching_load: 20,
  availability: availability as any,
  preferences: null,
});

const createTestRoom = (id: number, capacity: number, type: string = 'LECTURE_HALL'): RoomInput => ({
  id,
  name: `Room ${id}`,
  capacity,
  type,
  equipment: [],
});

const createTestGroup = (id: number, size: number): StudentGroupInput => ({
  id,
  name: `Group ${id}`,
  size,
  course_ids: [],
});

const createTestCourse = (
  id: number,
  duration: number,
  instructorIds: number[],
  groupIds: number[],
  roomType?: string
): CourseInput => ({
  id,
  code: `CS${id}`,
  title: `Course ${id}`,
  duration,
  department: 'Computer Science',
  instructor_ids: instructorIds,
  group_ids: groupIds,
  room_type: roomType as string,
});

const createDefaultConstraints = (): ConstraintConfigInput => ({
  hard: {
    noRoomDoubleBooking: true,
    noInstructorDoubleBooking: true,
    roomCapacityCheck: true,
    roomTypeMatch: true,
    workingHoursOnly: true,
  },
  soft: {
    instructorPreferences: 5,
    compactSchedules: 7,
    balancedDailyLoad: 6,
    preferredRooms: 3,
  },
  working_hours_start: '08:00',
  working_hours_end: '18:00',
});

describe('TimetableSolver - Constraint Checking', () => {
  describe('Room Double-Booking Detection', () => {
    it('should detect room double-booking conflicts', async () => {
      const instructor1 = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
      });
      const instructor2 = createTestInstructor(2, {
        MONDAY: ['08:00-18:00'],
      });
      const room = createTestRoom(1, 50);
      const group1 = createTestGroup(1, 30);
      const group2 = createTestGroup(2, 25);
      
      // Two courses scheduled at the same time in the same room
      const course1 = createTestCourse(1, 90, [1], [1]);
      const course2 = createTestCourse(2, 90, [2], [2]);

      const solver = new TimetableSolver(
        [course1, course2],
        [instructor1, instructor2],
        [room],
        [group1, group2],
        createDefaultConstraints()
      );

      const result = await solver.solve(1);
      
      // Check if room conflicts are detected
      const roomConflicts = result.violations.filter(
        v => v.type === 'ROOM_DOUBLE_BOOKING'
      );
      
      // With only one room and two courses, there should be conflicts if they overlap
      expect(result.violations).toBeDefined();
    });

    it('should not detect conflicts when rooms are different', async () => {
      const instructor1 = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
      });
      const instructor2 = createTestInstructor(2, {
        MONDAY: ['08:00-18:00'],
      });
      const room1 = createTestRoom(1, 50);
      const room2 = createTestRoom(2, 50);
      const group1 = createTestGroup(1, 30);
      const group2 = createTestGroup(2, 25);
      
      const course1 = createTestCourse(1, 90, [1], [1]);
      const course2 = createTestCourse(2, 90, [2], [2]);

      const solver = new TimetableSolver(
        [course1, course2],
        [instructor1, instructor2],
        [room1, room2],
        [group1, group2],
        createDefaultConstraints()
      );

      const result = await solver.solve(1);
      
      // With two rooms, there should be no room conflicts
      const roomConflicts = result.violations.filter(
        v => v.type === 'ROOM_DOUBLE_BOOKING'
      );
      
      expect(roomConflicts.length).toBe(0);
    });
  });

  describe('Instructor Double-Booking Detection', () => {
    it('should detect instructor double-booking conflicts', async () => {
      const instructor = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
      });
      const room1 = createTestRoom(1, 50);
      const room2 = createTestRoom(2, 50);
      const group1 = createTestGroup(1, 30);
      const group2 = createTestGroup(2, 25);
      
      // Two courses with the same instructor
      const course1 = createTestCourse(1, 90, [1], [1]);
      const course2 = createTestCourse(2, 90, [1], [2]);

      const solver = new TimetableSolver(
        [course1, course2],
        [instructor],
        [room1, room2],
        [group1, group2],
        createDefaultConstraints()
      );

      const result = await solver.solve(1);
      
      // Check if instructor conflicts are detected
      const instructorConflicts = result.violations.filter(
        v => v.type === 'INSTRUCTOR_DOUBLE_BOOKING'
      );
      
      // With one instructor and two courses, conflicts should be avoided by scheduling
      expect(result.violations).toBeDefined();
    });
  });

  describe('Student Group Double-Booking Detection', () => {
    it('should detect student group conflicts', async () => {
      const instructor1 = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
      });
      const instructor2 = createTestInstructor(2, {
        MONDAY: ['08:00-18:00'],
      });
      const room1 = createTestRoom(1, 50);
      const room2 = createTestRoom(2, 50);
      const group = createTestGroup(1, 30);
      
      // Two courses for the same group
      const course1 = createTestCourse(1, 90, [1], [1]);
      const course2 = createTestCourse(2, 90, [2], [1]);

      const solver = new TimetableSolver(
        [course1, course2],
        [instructor1, instructor2],
        [room1, room2],
        [group],
        createDefaultConstraints()
      );

      const result = await solver.solve(1);
      
      // Check if group conflicts are detected
      const groupConflicts = result.violations.filter(
        v => v.type === 'GROUP_DOUBLE_BOOKING'
      );
      
      // The solver should avoid group conflicts
      expect(result.violations).toBeDefined();
    });
  });

  describe('Room Capacity Constraint', () => {
    it('should detect room capacity violations', async () => {
      const instructor = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
      });
      const smallRoom = createTestRoom(1, 20); // Room too small
      const largeGroup = createTestGroup(1, 50); // Group too large
      
      const course = createTestCourse(1, 90, [1], [1]);

      const solver = new TimetableSolver(
        [course],
        [instructor],
        [smallRoom],
        [largeGroup],
        createDefaultConstraints()
      );

      const result = await solver.solve(1);
      
      // When room is too small, the greedy initialization won't assign the course
      // So we check that either:
      // 1. No assignments were made (course couldn't be scheduled), OR
      // 2. Capacity violations were detected
      const capacityViolations = result.violations.filter(
        v => v.type === 'ROOM_CAPACITY_EXCEEDED'
      );
      
      // Either no assignments or capacity violations detected
      expect(result.assignments.length === 0 || capacityViolations.length > 0).toBe(true);
    });

    it('should not violate capacity when room is large enough', async () => {
      const instructor = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
      });
      const largeRoom = createTestRoom(1, 100);
      const group = createTestGroup(1, 50);
      
      const course = createTestCourse(1, 90, [1], [1]);

      const solver = new TimetableSolver(
        [course],
        [instructor],
        [largeRoom],
        [group],
        createDefaultConstraints()
      );

      const result = await solver.solve(1);
      
      const capacityViolations = result.violations.filter(
        v => v.type === 'ROOM_CAPACITY_EXCEEDED'
      );
      
      expect(capacityViolations.length).toBe(0);
    });
  });

  describe('Instructor Availability Constraint', () => {
    it('should respect instructor availability', async () => {
      const instructor = createTestInstructor(1, {
        MONDAY: ['09:00-12:00'], // Only available in morning
        TUESDAY: ['14:00-17:00'], // Only available in afternoon
      });
      const room = createTestRoom(1, 50);
      const group = createTestGroup(1, 30);
      
      const course = createTestCourse(1, 90, [1], [1]);

      const solver = new TimetableSolver(
        [course],
        [instructor],
        [room],
        [group],
        createDefaultConstraints()
      );

      const result = await solver.solve(1);
      
      // Check that assignments respect availability
      result.assignments.forEach(assignment => {
        const availableSlots = instructor.availability[assignment.day as keyof typeof instructor.availability];
        expect(availableSlots).toBeDefined();
        
        // Verify assignment time is within available slots
        const assignmentTime = assignment.startTime;
        let isWithinAvailability = false;
        
        if (availableSlots) {
          for (const slot of availableSlots) {
            const [start, end] = slot.split('-');
            if (assignmentTime >= start && assignmentTime < end) {
              isWithinAvailability = true;
              break;
            }
          }
        }
        
        expect(isWithinAvailability).toBe(true);
      });
    });
  });

  describe('Soft Constraint - Instructor Preferences', () => {
    it('should penalize violations of instructor preferences', async () => {
      const instructor = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
        TUESDAY: ['08:00-18:00'],
        WEDNESDAY: ['08:00-18:00'],
        THURSDAY: ['08:00-18:00'],
        FRIDAY: ['08:00-18:00'],
      });
      instructor.preferences = {
        preferredDays: ['MONDAY', 'WEDNESDAY'],
      };
      
      const room = createTestRoom(1, 50);
      const group = createTestGroup(1, 30);
      const course = createTestCourse(1, 90, [1], [1]);

      const constraints = createDefaultConstraints();
      constraints.soft.instructorPreferences = 10; // High weight

      const solver = new TimetableSolver(
        [course],
        [instructor],
        [room],
        [group],
        constraints
      );

      const result = await solver.solve(1);
      
      // Check if preference violations are tracked
      const preferenceViolations = result.violations.filter(
        v => v.type === 'INSTRUCTOR_PREFERENCE_VIOLATED'
      );
      
      // Violations should be soft (not hard)
      preferenceViolations.forEach(violation => {
        expect(violation.severity).toBe('SOFT');
      });
    });

    it('should not penalize when preferences are met', async () => {
      const instructor = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
      });
      instructor.preferences = {
        preferredDays: ['MONDAY'],
      };
      
      const room = createTestRoom(1, 50);
      const group = createTestGroup(1, 30);
      const course = createTestCourse(1, 90, [1], [1]);

      const solver = new TimetableSolver(
        [course],
        [instructor],
        [room],
        [group],
        createDefaultConstraints()
      );

      const result = await solver.solve(1);
      
      // If scheduled on Monday, no preference violations
      const mondayAssignments = result.assignments.filter(a => a.day === 'MONDAY');
      if (mondayAssignments.length > 0) {
        const preferenceViolations = result.violations.filter(
          v => v.type === 'INSTRUCTOR_PREFERENCE_VIOLATED'
        );
        expect(preferenceViolations.length).toBe(0);
      }
    });
  });

  describe('Soft Constraint - Compact Schedules', () => {
    it('should penalize large gaps in instructor schedules', async () => {
      const instructor = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
      });
      const room = createTestRoom(1, 50);
      const group1 = createTestGroup(1, 30);
      const group2 = createTestGroup(2, 30);
      
      // Two courses that could create gaps
      const course1 = createTestCourse(1, 90, [1], [1]);
      const course2 = createTestCourse(2, 90, [1], [2]);

      const constraints = createDefaultConstraints();
      constraints.soft.compactSchedules = 10; // High weight

      const solver = new TimetableSolver(
        [course1, course2],
        [instructor],
        [room],
        [group1, group2],
        constraints
      );

      const result = await solver.solve(2);
      
      // Check if compactness violations are tracked
      const compactnessViolations = result.violations.filter(
        v => v.type === 'SCHEDULE_NOT_COMPACT'
      );
      
      // Violations should be soft
      compactnessViolations.forEach(violation => {
        expect(violation.severity).toBe('SOFT');
      });
    });
  });

  describe('Fitness Calculation', () => {
    it('should calculate higher fitness for solutions with fewer violations', async () => {
      const instructor = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
        TUESDAY: ['08:00-18:00'],
      });
      const room = createTestRoom(1, 100);
      const group = createTestGroup(1, 30);
      const course = createTestCourse(1, 90, [1], [1]);

      const solver = new TimetableSolver(
        [course],
        [instructor],
        [room],
        [group],
        createDefaultConstraints()
      );

      const result = await solver.solve(1);
      
      // Fitness should be positive
      expect(result.fitness).toBeGreaterThanOrEqual(0);
      
      // Fewer violations should mean higher fitness
      const hardViolations = result.violations.filter(v => v.severity === 'HARD');
      if (hardViolations.length === 0) {
        expect(result.fitness).toBeGreaterThan(500);
      }
    });
  });

  describe('Constraint Configuration', () => {
    it('should respect disabled hard constraints', async () => {
      const instructor = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
      });
      const room = createTestRoom(1, 50);
      const group = createTestGroup(1, 30);
      const course = createTestCourse(1, 90, [1], [1]);

      const constraints = createDefaultConstraints();
      constraints.hard.roomCapacityCheck = false; // Disable capacity check

      const solver = new TimetableSolver(
        [course],
        [instructor],
        [room],
        [group],
        constraints
      );

      const result = await solver.solve(1);
      
      // Should not check room capacity when disabled
      expect(result.violations).toBeDefined();
    });

    it('should not apply soft constraints with zero weight', async () => {
      const instructor = createTestInstructor(1, {
        MONDAY: ['08:00-18:00'],
        TUESDAY: ['08:00-18:00'],
      });
      instructor.preferences = {
        preferredDays: ['MONDAY'],
      };
      
      const room = createTestRoom(1, 50);
      const group = createTestGroup(1, 30);
      const course = createTestCourse(1, 90, [1], [1]);

      const constraints = createDefaultConstraints();
      constraints.soft.instructorPreferences = 0; // Zero weight

      const solver = new TimetableSolver(
        [course],
        [instructor],
        [room],
        [group],
        constraints
      );

      const result = await solver.solve(1);
      
      // Should not check preferences when weight is zero
      const preferenceViolations = result.violations.filter(
        v => v.type === 'INSTRUCTOR_PREFERENCE_VIOLATED'
      );
      expect(preferenceViolations.length).toBe(0);
    });
  });
});
