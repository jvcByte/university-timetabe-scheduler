/**
 * Centralized Zod validation schemas for the application
 * This file contains all validation schemas used across server actions and forms
 */

import { z } from "zod";

// ============================================================================
// Common Validation Helpers
// ============================================================================

/**
 * Custom error messages for common validation scenarios
 */
export const ValidationMessages = {
  required: (field: string) => `${field} is required`,
  minLength: (field: string, min: number) =>
    `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) =>
    `${field} must be at most ${max} characters`,
  email: "Invalid email address",
  positive: (field: string) => `${field} must be a positive number`,
  integer: (field: string) => `${field} must be an integer`,
  min: (field: string, min: number) => `${field} must be at least ${min}`,
  max: (field: string, max: number) => `${field} must be at most ${max}`,
  regex: (field: string, pattern: string) =>
    `${field} must match pattern: ${pattern}`,
} as const;

/**
 * Common regex patterns
 */
export const ValidationPatterns = {
  courseCode: /^[A-Z0-9-]+$/,
  time24Hour: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
  timeSlot: /^\d{2}:\d{2}-\d{2}:\d{2}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
} as const;

/**
 * Reusable field validators
 */
export const CommonValidators = {
  id: z.number().int().positive("ID must be a positive integer"),
  email: z.string().email(ValidationMessages.email).max(100),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  time24Hour: z
    .string()
    .regex(
      ValidationPatterns.time24Hour,
      "Time must be in HH:MM format (e.g., 08:00)"
    ),
  timeSlot: z
    .string()
    .regex(
      ValidationPatterns.timeSlot,
      "Time slot must be in format HH:MM-HH:MM"
    ),
} as const;

// ============================================================================
// Course Validation Schemas
// ============================================================================

export const courseSchema = z.object({
  code: z
    .string()
    .min(2, ValidationMessages.minLength("Course code", 2))
    .max(20, ValidationMessages.maxLength("Course code", 20))
    .regex(
      ValidationPatterns.courseCode,
      "Course code must contain only uppercase letters, numbers, and hyphens"
    ),
  title: z
    .string()
    .min(3, ValidationMessages.minLength("Course title", 3))
    .max(200, ValidationMessages.maxLength("Course title", 200)),
  duration: z
    .number()
    .int(ValidationMessages.integer("Duration"))
    .min(30, ValidationMessages.min("Duration", 30))
    .max(300, ValidationMessages.max("Duration", 300)),
  credits: z
    .number()
    .int(ValidationMessages.integer("Credits"))
    .min(1, ValidationMessages.min("Credits", 1))
    .max(10, ValidationMessages.max("Credits", 10)),
  departmentId: z
    .number()
    .int(ValidationMessages.integer("Department ID"))
    .positive("Department must be selected"),
  roomType: z
    .string()
    .max(50, ValidationMessages.maxLength("Room type", 50))
    .optional()
    .nullable(),
  instructorIds: z.array(z.number().int()).optional().default([]),
  groupIds: z.array(z.number().int()).optional().default([]),
});

export const updateCourseSchema = courseSchema.extend({
  id: CommonValidators.id,
});

export type CourseInput = z.infer<typeof courseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

// ============================================================================
// Instructor Validation Schemas
// ============================================================================

export const availabilitySchema = z.record(
  z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  z.array(CommonValidators.timeSlot)
);

export const preferencesSchema = z
  .object({
    preferredDays: z
      .array(
        z.enum([
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
          "SUNDAY",
        ])
      )
      .optional(),
    preferredTimes: z.array(z.string()).optional(),
  })
  .optional();

export const instructorSchema = z.object({
  name: z
    .string()
    .min(2, ValidationMessages.minLength("Name", 2))
    .max(100, ValidationMessages.maxLength("Name", 100)),
  email: CommonValidators.email,
  departmentId: z
    .number()
    .int(ValidationMessages.integer("Department ID"))
    .positive("Department must be selected"),
  teachingLoad: z
    .number()
    .int(ValidationMessages.integer("Teaching load"))
    .min(1, ValidationMessages.min("Teaching load", 1))
    .max(40, ValidationMessages.max("Teaching load", 40)),
  availability: availabilitySchema,
  preferences: preferencesSchema.nullable().optional(),
  userId: z.string().nullable().optional(),
});

export const updateInstructorSchema = instructorSchema.extend({
  id: CommonValidators.id,
});

export type InstructorInput = z.infer<typeof instructorSchema>;
export type UpdateInstructorInput = z.infer<typeof updateInstructorSchema>;

// ============================================================================
// Room Validation Schemas
// ============================================================================

export const roomSchema = z.object({
  name: z
    .string()
    .min(1, ValidationMessages.required("Room name"))
    .max(50, ValidationMessages.maxLength("Room name", 50)),
  building: z
    .string()
    .min(1, ValidationMessages.required("Building"))
    .max(100, ValidationMessages.maxLength("Building", 100)),
  capacity: z
    .number()
    .int(ValidationMessages.integer("Capacity"))
    .min(1, ValidationMessages.min("Capacity", 1))
    .max(1000, ValidationMessages.max("Capacity", 1000)),
  type: z
    .string()
    .min(1, ValidationMessages.required("Room type"))
    .max(50, ValidationMessages.maxLength("Room type", 50)),
  equipment: z.array(z.string()).optional().default([]),
});

export const updateRoomSchema = roomSchema.extend({
  id: CommonValidators.id,
});

export type RoomInput = z.infer<typeof roomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

// ============================================================================
// Student Group Validation Schemas
// ============================================================================

export const studentGroupSchema = z.object({
  name: z
    .string()
    .min(2, ValidationMessages.minLength("Group name", 2))
    .max(100, ValidationMessages.maxLength("Group name", 100)),
  program: z
    .string()
    .min(2, ValidationMessages.minLength("Program", 2))
    .max(100, ValidationMessages.maxLength("Program", 100)),
  year: z
    .number()
    .int(ValidationMessages.integer("Year"))
    .min(1, ValidationMessages.min("Year", 1))
    .max(10, ValidationMessages.max("Year", 10)),
  semester: z
    .number()
    .int(ValidationMessages.integer("Semester"))
    .min(1, ValidationMessages.min("Semester", 1))
    .max(2, ValidationMessages.max("Semester", 2)),
  size: z
    .number()
    .int(ValidationMessages.integer("Size"))
    .min(1, ValidationMessages.min("Group size", 1))
    .max(500, ValidationMessages.max("Group size", 500)),
  courseIds: z.array(z.number().int()).optional().default([]),
  userId: z.string().nullable().optional(),
});

export const updateStudentGroupSchema = studentGroupSchema.extend({
  id: CommonValidators.id,
});

export type StudentGroupInput = z.infer<typeof studentGroupSchema>;
export type UpdateStudentGroupInput = z.infer<typeof updateStudentGroupSchema>;

// ============================================================================
// Constraint Configuration Validation Schemas
// ============================================================================

const weightSchema = z
  .number()
  .int(ValidationMessages.integer("Weight"))
  .min(0, ValidationMessages.min("Weight", 0))
  .max(10, ValidationMessages.max("Weight", 10));

export const constraintConfigSchema = z.object({
  name: z
    .string()
    .min(3, ValidationMessages.minLength("Name", 3))
    .max(100, ValidationMessages.maxLength("Name", 100)),
  isDefault: z.boolean().optional().default(false),

  // Hard constraints
  noRoomDoubleBooking: z.boolean().optional().default(true),
  noInstructorDoubleBooking: z.boolean().optional().default(true),
  roomCapacityCheck: z.boolean().optional().default(true),
  roomTypeMatch: z.boolean().optional().default(true),
  workingHoursOnly: z.boolean().optional().default(true),

  // Soft constraint weights (0-10)
  instructorPreferencesWeight: weightSchema.optional().default(5),
  compactSchedulesWeight: weightSchema.optional().default(7),
  balancedDailyLoadWeight: weightSchema.optional().default(6),
  preferredRoomsWeight: weightSchema.optional().default(3),

  // Working hours
  workingHoursStart: CommonValidators.time24Hour.optional().default("08:00"),
  workingHoursEnd: CommonValidators.time24Hour.optional().default("18:00"),
});

export const updateConstraintConfigSchema = z
  .object({
    id: CommonValidators.id,
    name: z
      .string()
      .min(3, ValidationMessages.minLength("Name", 3))
      .max(100, ValidationMessages.maxLength("Name", 100))
      .optional(),
    isDefault: z.boolean().optional(),

    // Hard constraints
    noRoomDoubleBooking: z.boolean().optional(),
    noInstructorDoubleBooking: z.boolean().optional(),
    roomCapacityCheck: z.boolean().optional(),
    roomTypeMatch: z.boolean().optional(),
    workingHoursOnly: z.boolean().optional(),

    // Soft constraint weights (0-10)
    instructorPreferencesWeight: weightSchema.optional(),
    compactSchedulesWeight: weightSchema.optional(),
    balancedDailyLoadWeight: weightSchema.optional(),
    preferredRoomsWeight: weightSchema.optional(),

    // Working hours
    workingHoursStart: CommonValidators.time24Hour.optional(),
    workingHoursEnd: CommonValidators.time24Hour.optional(),
  })
  .refine(
    (data) => {
      // Validate that working hours end is after start
      if (data.workingHoursStart && data.workingHoursEnd) {
        return data.workingHoursStart < data.workingHoursEnd;
      }
      return true;
    },
    {
      message: "Working hours end time must be after start time",
      path: ["workingHoursEnd"],
    }
  );

export type ConstraintConfigInput = z.infer<typeof constraintConfigSchema>;
export type UpdateConstraintConfigInput = z.infer<
  typeof updateConstraintConfigSchema
>;

// ============================================================================
// Authentication Validation Schemas
// ============================================================================

export const loginSchema = z.object({
  email: CommonValidators.email,
  password: z
    .string()
    .min(6, ValidationMessages.minLength("Password", 6))
    .max(100, ValidationMessages.maxLength("Password", 100)),
});

export const registerSchema = z.object({
  name: CommonValidators.name,
  email: CommonValidators.email,
  password: z
    .string()
    .min(6, ValidationMessages.minLength("Password", 6))
    .max(100, ValidationMessages.maxLength("Password", 100)),
  role: z.enum(["ADMIN", "FACULTY", "STUDENT"]).default("STUDENT"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================================================
// Timetable Validation Schemas
// ============================================================================

export const generateTimetableSchema = z.object({
  name: z
    .string()
    .min(3, ValidationMessages.minLength("Name", 3))
    .max(100, ValidationMessages.maxLength("Name", 100)),
  semester: z
    .string()
    .min(1, ValidationMessages.required("Semester"))
    .max(50, ValidationMessages.maxLength("Semester", 50)),
  academicYear: z
    .string()
    .min(4, ValidationMessages.minLength("Academic year", 4))
    .max(20, ValidationMessages.maxLength("Academic year", 20))
    .regex(/^\d{4}(-\d{4})?$/, "Academic year must be in format YYYY or YYYY-YYYY"),
  constraintConfigId: z.number().int().positive().optional(),
  timeLimitSeconds: z
    .number()
    .int()
    .min(10, ValidationMessages.min("Time limit", 10))
    .max(600, ValidationMessages.max("Time limit", 600))
    .optional()
    .default(300),
});

export const updateAssignmentSchema = z.object({
  assignmentId: CommonValidators.id,
  day: z
    .enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ])
    .optional(),
  startTime: CommonValidators.time24Hour.optional(),
  endTime: CommonValidators.time24Hour.optional(),
  roomId: z.number().int().positive().optional(),
  instructorId: z.number().int().positive().optional(),
});

export type GenerateTimetableInput = z.infer<typeof generateTimetableSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

// ============================================================================
// Validation Utility Functions
// ============================================================================

/**
 * Validates time slot format and ensures end time is after start time
 */
export function validateTimeSlot(timeSlot: string): {
  valid: boolean;
  error?: string;
} {
  if (!ValidationPatterns.timeSlot.test(timeSlot)) {
    return {
      valid: false,
      error: "Time slot must be in format HH:MM-HH:MM",
    };
  }

  const [start, end] = timeSlot.split("-");
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes >= endMinutes) {
    return {
      valid: false,
      error: "End time must be after start time",
    };
  }

  return { valid: true };
}

/**
 * Validates working hours configuration
 */
export function validateWorkingHours(
  start: string,
  end: string
): { valid: boolean; error?: string } {
  if (!ValidationPatterns.time24Hour.test(start)) {
    return {
      valid: false,
      error: "Start time must be in HH:MM format",
    };
  }

  if (!ValidationPatterns.time24Hour.test(end)) {
    return {
      valid: false,
      error: "End time must be in HH:MM format",
    };
  }

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes >= endMinutes) {
    return {
      valid: false,
      error: "End time must be after start time",
    };
  }

  // Ensure reasonable working hours (at least 2 hours)
  if (endMinutes - startMinutes < 120) {
    return {
      valid: false,
      error: "Working hours must span at least 2 hours",
    };
  }

  return { valid: true };
}

/**
 * Validates that at least one soft constraint has a non-zero weight
 */
export function validateSoftConstraintWeights(weights: {
  instructorPreferencesWeight?: number;
  compactSchedulesWeight?: number;
  balancedDailyLoadWeight?: number;
  preferredRoomsWeight?: number;
}): { valid: boolean; error?: string } {
  const weightValues = Object.values(weights).filter(
    (w) => w !== undefined
  ) as number[];

  if (weightValues.length > 0 && weightValues.every((w) => w === 0)) {
    return {
      valid: false,
      error: "At least one soft constraint weight must be greater than 0",
    };
  }

  return { valid: true };
}

/**
 * Safe parse with detailed error messages
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Extract first error message for user-friendly display
  const firstError = result.error.errors[0];
  const errorMessage = firstError.message;

  return {
    success: false,
    error: errorMessage,
    errors: result.error,
  };
}
