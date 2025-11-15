"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  updateConstraintConfig as updateConstraintConfigLib,
  createConstraintConfig as createConstraintConfigLib,
  deleteConstraintConfig as deleteConstraintConfigLib,
  setDefaultConstraintConfig as setDefaultConstraintConfigLib,
  getConstraintConfigById,
} from "@/lib/constraints";
import {
  handleActionError,
  success,
  logError,
  assertExists,
  type ActionResult,
} from "@/lib/error-handling";

// Validation schemas
const timeSchema = z
  .string()
  .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format (e.g., 08:00)");

const weightSchema = z
  .number()
  .int("Weight must be an integer")
  .min(0, "Weight must be at least 0")
  .max(10, "Weight must be at most 10");

const constraintConfigSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be at most 100 characters"),
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
  workingHoursStart: timeSchema.optional().default("08:00"),
  workingHoursEnd: timeSchema.optional().default("18:00"),
});

const updateConstraintConfigSchema = z.object({
  id: z.number().int().positive("ID must be a positive integer"),
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be at most 100 characters")
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
  workingHoursStart: timeSchema.optional(),
  workingHoursEnd: timeSchema.optional(),
}).refine(
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
export type UpdateConstraintConfigInput = z.infer<typeof updateConstraintConfigSchema>;

/**
 * Validate constraint configuration data
 * Performs additional business logic validation beyond schema validation
 */
function validateConstraintConfig(data: {
  workingHoursStart?: string;
  workingHoursEnd?: string;
  instructorPreferencesWeight?: number;
  compactSchedulesWeight?: number;
  balancedDailyLoadWeight?: number;
  preferredRoomsWeight?: number;
}): { valid: boolean; error?: string } {
  // Validate working hours
  if (data.workingHoursStart && data.workingHoursEnd) {
    const [startHour, startMin] = data.workingHoursStart.split(":").map(Number);
    const [endHour, endMin] = data.workingHoursEnd.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes >= endMinutes) {
      return {
        valid: false,
        error: "Working hours end time must be after start time",
      };
    }
    
    // Ensure reasonable working hours (at least 2 hours)
    if (endMinutes - startMinutes < 120) {
      return {
        valid: false,
        error: "Working hours must span at least 2 hours",
      };
    }
  }
  
  // Validate that at least one soft constraint has a non-zero weight
  const weights = [
    data.instructorPreferencesWeight,
    data.compactSchedulesWeight,
    data.balancedDailyLoadWeight,
    data.preferredRoomsWeight,
  ].filter((w) => w !== undefined);
  
  if (weights.length > 0 && weights.every((w) => w === 0)) {
    return {
      valid: false,
      error: "At least one soft constraint weight must be greater than 0",
    };
  }
  
  return { valid: true };
}

/**
 * Create a new constraint configuration
 */
export async function createConstraintConfig(
  input: ConstraintConfigInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = constraintConfigSchema.parse(input);
    
    // Additional validation
    const validationResult = validateConstraintConfig(validated);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.error,
      };
    }
    
    const config = await createConstraintConfigLib(validated);
    
    revalidatePath("/admin/constraints");
    return success({ id: config.id });
  } catch (error) {
    logError("createConstraintConfig", error, { input });
    return handleActionError(error);
  }
}

/**
 * Update an existing constraint configuration
 */
export async function updateConstraintConfig(
  input: UpdateConstraintConfigInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = updateConstraintConfigSchema.parse(input);
    
    // Check if constraint config exists
    const existingConfig = await getConstraintConfigById(validated.id);
    assertExists(existingConfig, "Constraint configuration");
    
    // Merge with existing data for validation
    const mergedData = {
      workingHoursStart: validated.workingHoursStart ?? existingConfig.workingHoursStart,
      workingHoursEnd: validated.workingHoursEnd ?? existingConfig.workingHoursEnd,
      instructorPreferencesWeight: validated.instructorPreferencesWeight ?? existingConfig.instructorPreferencesWeight,
      compactSchedulesWeight: validated.compactSchedulesWeight ?? existingConfig.compactSchedulesWeight,
      balancedDailyLoadWeight: validated.balancedDailyLoadWeight ?? existingConfig.balancedDailyLoadWeight,
      preferredRoomsWeight: validated.preferredRoomsWeight ?? existingConfig.preferredRoomsWeight,
    };
    
    // Additional validation
    const validationResult = validateConstraintConfig(mergedData);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.error,
      };
    }
    
    const { id, ...updateData } = validated;
    const config = await updateConstraintConfigLib(id, updateData);
    
    revalidatePath("/admin/constraints");
    revalidatePath(`/admin/constraints/${id}`);
    return success({ id: config.id });
  } catch (error) {
    logError("updateConstraintConfig", error, { configId: input.id });
    return handleActionError(error);
  }
}

/**
 * Delete a constraint configuration
 */
export async function deleteConstraintConfig(
  id: number
): Promise<ActionResult> {
  try {
    await deleteConstraintConfigLib(id);
    
    revalidatePath("/admin/constraints");
    return success();
  } catch (error) {
    logError("deleteConstraintConfig", error, { configId: id });
    return handleActionError(error);
  }
}

/**
 * Set a constraint configuration as the default
 */
export async function setDefaultConstraintConfig(
  id: number
): Promise<ActionResult<{ id: number }>> {
  try {
    // Check if constraint config exists
    const existingConfig = await getConstraintConfigById(id);
    assertExists(existingConfig, "Constraint configuration");
    
    const config = await setDefaultConstraintConfigLib(id);
    
    revalidatePath("/admin/constraints");
    return success({ id: config.id });
  } catch (error) {
    logError("setDefaultConstraintConfig", error, { configId: id });
    return handleActionError(error);
  }
}
