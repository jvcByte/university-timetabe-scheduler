"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  handleActionError,
  success,
  logError,
  assertExists,
  type ActionResult,
} from "@/lib/error-handling";

// Validation schemas
const availabilitySchema = z.record(
  z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  z.array(z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Time slot must be in format HH:MM-HH:MM"))
);

const preferencesSchema = z.object({
  preferredDays: z.array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])).optional(),
  preferredTimes: z.array(z.string()).optional(),
}).optional();

const instructorSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters"),
  departmentId: z
    .number()
    .int("Department ID must be an integer")
    .positive("Department must be selected"),
  teachingLoad: z
    .number()
    .int("Teaching load must be an integer")
    .min(1, "Teaching load must be at least 1 hour")
    .max(40, "Teaching load must be at most 40 hours"),
  availability: availabilitySchema,
  preferences: preferencesSchema.nullable().optional(),
  userId: z.string().nullable().optional(),
});

const updateInstructorSchema = instructorSchema.extend({
  id: z.number().int(),
});

export type InstructorInput = z.infer<typeof instructorSchema>;
export type UpdateInstructorInput = z.infer<typeof updateInstructorSchema>;

/**
 * Create a new instructor
 */
export async function createInstructor(
  input: InstructorInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = instructorSchema.parse(input);

    // Check if email already exists
    const existingInstructor = await prisma.instructor.findUnique({
      where: { email: validated.email },
    });

    if (existingInstructor) {
      return {
        success: false,
        error: `Instructor with email "${validated.email}" already exists`,
      };
    }

    // If userId is provided, check if it exists and is not already linked
    if (validated.userId) {
      const user = await prisma.user.findUnique({
        where: { id: validated.userId },
        include: { instructor: true },
      });

      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      if (user.instructor) {
        return {
          success: false,
          error: "User is already linked to another instructor",
        };
      }

      if (user.role !== "FACULTY") {
        return {
          success: false,
          error: "User must have FACULTY role to be linked to an instructor",
        };
      }
    }

    // Create instructor
    const instructor = await prisma.instructor.create({
      data: {
        name: validated.name,
        email: validated.email,
        departmentId: validated.departmentId,
        teachingLoad: validated.teachingLoad,
        availability: validated.availability,
        preferences: validated.preferences || undefined,
        userId: validated.userId || null,
      },
    });

    revalidatePath("/admin/instructors");
    return success({ id: instructor.id });
  } catch (error) {
    logError("createInstructor", error, { input });
    return handleActionError(error);
  }
}

/**
 * Update an existing instructor
 */
export async function updateInstructor(
  input: UpdateInstructorInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = updateInstructorSchema.parse(input);

    // Check if instructor exists
    const existingInstructor = await prisma.instructor.findUnique({
      where: { id: validated.id },
    });

    assertExists(existingInstructor, "Instructor");

    // Check if email is being changed and if new email already exists
    if (validated.email !== existingInstructor.email) {
      const emailExists = await prisma.instructor.findUnique({
        where: { email: validated.email },
      });

      if (emailExists) {
        return {
          success: false,
          error: `Instructor with email "${validated.email}" already exists`,
        };
      }
    }

    // If userId is being changed, validate it
    if (validated.userId !== existingInstructor.userId) {
      if (validated.userId) {
        const user = await prisma.user.findUnique({
          where: { id: validated.userId },
          include: { instructor: true },
        });

        if (!user) {
          return {
            success: false,
            error: "User not found",
          };
        }

        if (user.instructor && user.instructor.id !== validated.id) {
          return {
            success: false,
            error: "User is already linked to another instructor",
          };
        }

        if (user.role !== "FACULTY") {
          return {
            success: false,
            error: "User must have FACULTY role to be linked to an instructor",
          };
        }
      }
    }

    // Update instructor
    await prisma.instructor.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        email: validated.email,
        departmentId: validated.departmentId,
        teachingLoad: validated.teachingLoad,
        availability: validated.availability,
        preferences: validated.preferences || undefined,
        userId: validated.userId || null,
      },
    });

    revalidatePath("/admin/instructors");
    revalidatePath(`/admin/instructors/${validated.id}`);
    return success({ id: validated.id });
  } catch (error) {
    logError("updateInstructor", error, { instructorId: input.id });
    return handleActionError(error);
  }
}

/**
 * Delete an instructor
 */
export async function deleteInstructor(
  id: number
): Promise<ActionResult> {
  try {
    // Check if instructor exists
    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true,
            courses: true,
          },
        },
      },
    });

    assertExists(instructor, "Instructor");

    // Check if instructor has assignments
    if (instructor._count.assignments > 0) {
      return {
        success: false,
        error: `Cannot delete instructor "${instructor.name}" because they have ${instructor._count.assignments} assignment(s) in timetables. Please remove the assignments first.`,
      };
    }

    // Check if instructor has courses
    if (instructor._count.courses > 0) {
      return {
        success: false,
        error: `Cannot delete instructor "${instructor.name}" because they are assigned to ${instructor._count.courses} course(s). Please remove the course assignments first.`,
      };
    }

    // Delete instructor
    await prisma.instructor.delete({
      where: { id },
    });

    revalidatePath("/admin/instructors");
    return success();
  } catch (error) {
    logError("deleteInstructor", error, { instructorId: id });
    return handleActionError(error);
  }
}

/**
 * Update instructor availability (for faculty users)
 */
export async function updateInstructorAvailability(
  instructorId: number,
  availability: Record<string, string[]>,
  preferences?: { preferredDays?: string[]; preferredTimes?: string[] }
): Promise<ActionResult> {
  try {
    // Validate availability data
    const validated = availabilitySchema.parse(availability);
    
    // Validate preferences if provided
    let validatedPreferences = null;
    if (preferences) {
      validatedPreferences = preferencesSchema.parse(preferences);
    }

    // Check if instructor exists
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
    });

    assertExists(instructor, "Instructor");

    // Update instructor availability and preferences
    await prisma.instructor.update({
      where: { id: instructorId },
      data: {
        availability: validated,
        preferences: validatedPreferences || undefined,
      },
    });

    revalidatePath("/faculty");
    revalidatePath("/faculty/availability");
    revalidatePath(`/admin/instructors/${instructorId}`);
    
    return success();
  } catch (error) {
    logError("updateInstructorAvailability", error, { instructorId });
    return handleActionError(error);
  }
}
