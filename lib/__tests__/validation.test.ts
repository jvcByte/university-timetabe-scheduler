import { describe, it, expect } from 'vitest';
import {
  ValidationPatterns,
  courseSchema,
  instructorSchema,
  roomSchema,
  studentGroupSchema,
  constraintConfigSchema,
  updateConstraintConfigSchema,
  loginSchema,
  registerSchema,
  generateTimetableSchema,
  validateTimeSlot,
  validateWorkingHours,
  validateSoftConstraintWeights,
  safeValidate,
} from '../validation';

describe('ValidationPatterns', () => {
  describe('courseCode', () => {
    it('should match valid course codes', () => {
      expect(ValidationPatterns.courseCode.test('CS101')).toBe(true);
      expect(ValidationPatterns.courseCode.test('MATH-201')).toBe(true);
      expect(ValidationPatterns.courseCode.test('ENG123')).toBe(true);
    });

    it('should reject invalid course codes', () => {
      expect(ValidationPatterns.courseCode.test('cs101')).toBe(false);
      expect(ValidationPatterns.courseCode.test('CS 101')).toBe(false);
      expect(ValidationPatterns.courseCode.test('CS@101')).toBe(false);
    });
  });

  describe('time24Hour', () => {
    it('should match valid 24-hour times', () => {
      expect(ValidationPatterns.time24Hour.test('08:00')).toBe(true);
      expect(ValidationPatterns.time24Hour.test('23:59')).toBe(true);
      expect(ValidationPatterns.time24Hour.test('00:00')).toBe(true);
    });

    it('should reject invalid times', () => {
      expect(ValidationPatterns.time24Hour.test('24:00')).toBe(false);
      expect(ValidationPatterns.time24Hour.test('8:00')).toBe(false);
      expect(ValidationPatterns.time24Hour.test('08:60')).toBe(false);
    });
  });

  describe('timeSlot', () => {
    it('should match valid time slots', () => {
      expect(ValidationPatterns.timeSlot.test('08:00-09:00')).toBe(true);
      expect(ValidationPatterns.timeSlot.test('14:30-16:00')).toBe(true);
    });

    it('should reject invalid time slots', () => {
      expect(ValidationPatterns.timeSlot.test('8:00-9:00')).toBe(false);
      expect(ValidationPatterns.timeSlot.test('08:00-09')).toBe(false);
    });
  });
});

describe('courseSchema', () => {
  it('should validate a valid course', () => {
    const validCourse = {
      code: 'CS101',
      title: 'Introduction to Computer Science',
      duration: 90,
      credits: 3,
      departmentId: 1,
      roomType: 'LECTURE_HALL',
      instructorIds: [1, 2],
      groupIds: [1],
    };

    const result = courseSchema.safeParse(validCourse);
    expect(result.success).toBe(true);
  });

  it('should reject course with invalid code', () => {
    const invalidCourse = {
      code: 'cs101',
      title: 'Introduction to Computer Science',
      duration: 90,
      credits: 3,
      departmentId: 1,
    };

    const result = courseSchema.safeParse(invalidCourse);
    expect(result.success).toBe(false);
  });

  it('should reject course with duration out of range', () => {
    const invalidCourse = {
      code: 'CS101',
      title: 'Introduction to Computer Science',
      duration: 20,
      credits: 3,
      departmentId: 1,
    };

    const result = courseSchema.safeParse(invalidCourse);
    expect(result.success).toBe(false);
  });

  it('should use default empty arrays for optional fields', () => {
    const course = {
      code: 'CS101',
      title: 'Introduction to Computer Science',
      duration: 90,
      credits: 3,
      departmentId: 1,
    };

    const result = courseSchema.safeParse(course);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.instructorIds).toEqual([]);
      expect(result.data.groupIds).toEqual([]);
    }
  });
});

describe('instructorSchema', () => {
  it('should validate a valid instructor', () => {
    const validInstructor = {
      name: 'John Doe',
      email: 'john.doe@university.edu',
      departmentId: 1,
      teachingLoad: 20,
      availability: {
        MONDAY: ['09:00-12:00', '14:00-17:00'],
        WEDNESDAY: ['09:00-12:00'],
      },
    };

    const result = instructorSchema.safeParse(validInstructor);
    expect(result.success).toBe(true);
  });

  it('should reject instructor with invalid email', () => {
    const invalidInstructor = {
      name: 'John Doe',
      email: 'invalid-email',
      departmentId: 1,
      teachingLoad: 20,
      availability: {},
    };

    const result = instructorSchema.safeParse(invalidInstructor);
    expect(result.success).toBe(false);
  });

  it('should reject instructor with teaching load out of range', () => {
    const invalidInstructor = {
      name: 'John Doe',
      email: 'john.doe@university.edu',
      departmentId: 1,
      teachingLoad: 50,
      availability: {},
    };

    const result = instructorSchema.safeParse(invalidInstructor);
    expect(result.success).toBe(false);
  });
});

describe('roomSchema', () => {
  it('should validate a valid room', () => {
    const validRoom = {
      name: 'Room 101',
      building: 'Science Building',
      capacity: 50,
      type: 'LECTURE_HALL',
      equipment: ['PROJECTOR', 'WHITEBOARD'],
    };

    const result = roomSchema.safeParse(validRoom);
    expect(result.success).toBe(true);
  });

  it('should reject room with capacity out of range', () => {
    const invalidRoom = {
      name: 'Room 101',
      building: 'Science Building',
      capacity: 0,
      type: 'LECTURE_HALL',
    };

    const result = roomSchema.safeParse(invalidRoom);
    expect(result.success).toBe(false);
  });

  it('should use default empty array for equipment', () => {
    const room = {
      name: 'Room 101',
      building: 'Science Building',
      capacity: 50,
      type: 'LECTURE_HALL',
    };

    const result = roomSchema.safeParse(room);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.equipment).toEqual([]);
    }
  });
});

describe('studentGroupSchema', () => {
  it('should validate a valid student group', () => {
    const validGroup = {
      name: 'CS-2025-A',
      program: 'Computer Science',
      year: 2,
      semester: 1,
      size: 30,
      courseIds: [1, 2, 3],
    };

    const result = studentGroupSchema.safeParse(validGroup);
    expect(result.success).toBe(true);
  });

  it('should reject group with invalid year', () => {
    const invalidGroup = {
      name: 'CS-2025-A',
      program: 'Computer Science',
      year: 0,
      semester: 1,
      size: 30,
    };

    const result = studentGroupSchema.safeParse(invalidGroup);
    expect(result.success).toBe(false);
  });

  it('should reject group with invalid semester', () => {
    const invalidGroup = {
      name: 'CS-2025-A',
      program: 'Computer Science',
      year: 2,
      semester: 3,
      size: 30,
    };

    const result = studentGroupSchema.safeParse(invalidGroup);
    expect(result.success).toBe(false);
  });
});

describe('constraintConfigSchema', () => {
  it('should validate a valid constraint config', () => {
    const validConfig = {
      name: 'Default Configuration',
      isDefault: true,
      noRoomDoubleBooking: true,
      noInstructorDoubleBooking: true,
      roomCapacityCheck: true,
      roomTypeMatch: true,
      workingHoursOnly: true,
      instructorPreferencesWeight: 5,
      compactSchedulesWeight: 7,
      balancedDailyLoadWeight: 6,
      preferredRoomsWeight: 3,
      workingHoursStart: '08:00',
      workingHoursEnd: '18:00',
    };

    const result = constraintConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should use default values for optional fields', () => {
    const minimalConfig = {
      name: 'Test Configuration',
    };

    const result = constraintConfigSchema.safeParse(minimalConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDefault).toBe(false);
      expect(result.data.noRoomDoubleBooking).toBe(true);
      expect(result.data.instructorPreferencesWeight).toBe(5);
      expect(result.data.workingHoursStart).toBe('08:00');
    }
  });

  it('should reject config with weight out of range', () => {
    const invalidConfig = {
      name: 'Test Configuration',
      instructorPreferencesWeight: 15,
    };

    const result = constraintConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });
});

describe('updateConstraintConfigSchema', () => {
  it('should validate working hours end after start', () => {
    const validUpdate = {
      id: 1,
      workingHoursStart: '08:00',
      workingHoursEnd: '18:00',
    };

    const result = updateConstraintConfigSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should reject working hours end before start', () => {
    const invalidUpdate = {
      id: 1,
      workingHoursStart: '18:00',
      workingHoursEnd: '08:00',
    };

    const result = updateConstraintConfigSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should validate valid login credentials', () => {
    const validLogin = {
      email: 'user@example.com',
      password: 'password123',
    };

    const result = loginSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it('should reject short password', () => {
    const invalidLogin = {
      email: 'user@example.com',
      password: '12345',
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('should validate valid registration', () => {
    const validRegister = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'STUDENT' as const,
    };

    const result = registerSchema.safeParse(validRegister);
    expect(result.success).toBe(true);
  });

  it('should use default role STUDENT', () => {
    const register = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    const result = registerSchema.safeParse(register);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('STUDENT');
    }
  });
});

describe('generateTimetableSchema', () => {
  it('should validate valid timetable generation input', () => {
    const validInput = {
      name: 'Fall 2025 Timetable',
      semester: 'Fall 2025',
      academicYear: '2025-2025',
      constraintConfigId: 1,
      timeLimitSeconds: 300,
    };

    const result = generateTimetableSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should accept academic year in YYYY format', () => {
    const input = {
      name: 'Fall 2025 Timetable',
      semester: 'Fall 2025',
      academicYear: '2025',
    };

    const result = generateTimetableSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject invalid academic year format', () => {
    const invalidInput = {
      name: 'Fall 2025 Timetable',
      semester: 'Fall 2025',
      academicYear: '24-25',
    };

    const result = generateTimetableSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should use default time limit', () => {
    const input = {
      name: 'Fall 2025 Timetable',
      semester: 'Fall 2025',
      academicYear: '2025',
    };

    const result = generateTimetableSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeLimitSeconds).toBe(300);
    }
  });
});

describe('validateTimeSlot', () => {
  it('should validate correct time slot', () => {
    const result = validateTimeSlot('09:00-10:30');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject invalid format', () => {
    const result = validateTimeSlot('9:00-10:30');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject end time before start time', () => {
    const result = validateTimeSlot('10:30-09:00');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('after start time');
  });

  it('should reject equal start and end times', () => {
    const result = validateTimeSlot('09:00-09:00');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('after start time');
  });
});

describe('validateWorkingHours', () => {
  it('should validate correct working hours', () => {
    const result = validateWorkingHours('08:00', '18:00');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject invalid start time format', () => {
    const result = validateWorkingHours('8:00', '18:00');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Start time');
  });

  it('should reject invalid end time format', () => {
    const result = validateWorkingHours('08:00', '18');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('End time');
  });

  it('should reject end time before start time', () => {
    const result = validateWorkingHours('18:00', '08:00');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('after start time');
  });

  it('should reject working hours less than 2 hours', () => {
    const result = validateWorkingHours('08:00', '09:30');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 2 hours');
  });

  it('should accept exactly 2 hours', () => {
    const result = validateWorkingHours('08:00', '10:00');
    expect(result.valid).toBe(true);
  });
});

describe('validateSoftConstraintWeights', () => {
  it('should validate when at least one weight is non-zero', () => {
    const result = validateSoftConstraintWeights({
      instructorPreferencesWeight: 5,
      compactSchedulesWeight: 0,
      balancedDailyLoadWeight: 0,
      preferredRoomsWeight: 0,
    });
    expect(result.valid).toBe(true);
  });

  it('should reject when all weights are zero', () => {
    const result = validateSoftConstraintWeights({
      instructorPreferencesWeight: 0,
      compactSchedulesWeight: 0,
      balancedDailyLoadWeight: 0,
      preferredRoomsWeight: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('At least one');
  });

  it('should validate empty weights object', () => {
    const result = validateSoftConstraintWeights({});
    expect(result.valid).toBe(true);
  });
});

describe('safeValidate', () => {
  it('should return success for valid data', () => {
    const result = safeValidate(loginSchema, {
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('should return error for invalid data', () => {
    const result = safeValidate(loginSchema, {
      email: 'invalid-email',
      password: '123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.errors).toBeDefined();
    }
  });

  it('should include detailed errors', () => {
    const result = safeValidate(courseSchema, {
      code: 'invalid',
      title: 'Test',
      duration: 10,
      credits: 3,
      departmentId: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
    }
  });
});
