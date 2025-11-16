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
const studentGroupSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(100, "Group name must be at most 100 characters"),
  program: z
    .string()
    .min(2, "Program must be at least 2 characters")
    .max(100, "Program must be at most 100 characters"),
  year: z
    .number()
    .int("Year must be an integer")
    .min(1, "Year must be at least 1")
    .max(10, "Year must be at most 10"),
  semester: z
    .number()
    .int("Semester must be an integer")
    .min(1, "Semester must be at least 1")
    .max(2, "Semester must be at most 2"),
  size: z
    .number()
    .int("Size must be an integer")
    .min(1, "Group size must be at least 1")
    .max(500, "Group size must be at most 500"),
  courseIds: z.array(z.number().int()).optional().default([]),
  userId: z.string().nullable().optional(),
});

const updateStudentGroupSchema = studentGroupSchema.extend({
  id: z.number().int(),
});

export type StudentGroupInput = z.infer<typeof studentGroupSchema>;
export type UpdateStudentGroupInput = z.infer<typeof updateStudentGroupSchema>;

/**
 * Create a new student group
 */
export async function createStudentGroup(
  input: StudentGroupInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = studentGroupSchema.parse(input);

    // Check if group name already exists
    const existingGroup = await prisma.studentGroup.findUnique({
      where: { name: validated.name },
    });

    if (existingGroup) {
      return {
        success: false,
        error: `Student group with name "${validated.name}" already exists`,
      };
    }

    // Create student group with course associations
    const studentGroup = await prisma.studentGroup.create({
      data: {
        name: validated.name,
        program: validated.program,
        year: validated.year,
        semester: validated.semester,
        size: validated.size,
        courses: {
          create: validated.courseIds.map((courseId) => ({
            courseId,
          })),
        },
      },
    });

    revalidatePath("/admin/groups");
    return success({ id: studentGroup.id });
  } catch (error) {
    logError("createStudentGroup", error, { input });
    return handleActionError(error);
  }
}

/**
 * Update an existing student group
 */
export async function updateStudentGroup(
  input: UpdateStudentGroupInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = updateStudentGroupSchema.parse(input);

    // Check if student group exists
    const existingGroup = await prisma.studentGroup.findUnique({
      where: { id: validated.id },
    });

    assertExists(existingGroup, "Student group");

    // Check if name is being changed and if new name already exists
    if (validated.name !== existingGroup.name) {
      const nameExists = await prisma.studentGroup.findUnique({
        where: { name: validated.name },
      });

      if (nameExists) {
        return {
          success: false,
          error: `Student group with name "${validated.name}" already exists`,
        };
      }
    }

    // Update student group with course associations
    await prisma.$transaction(async (tx) => {
      // Update student group basic fields
      await tx.studentGroup.update({
        where: { id: validated.id },
        data: {
          name: validated.name,
          program: validated.program,
          year: validated.year,
          semester: validated.semester,
          size: validated.size,
        },
      });

      // Update course associations - delete all and recreate
      await tx.courseGroup.deleteMany({
        where: { groupId: validated.id },
      });

      if (validated.courseIds.length > 0) {
        await tx.courseGroup.createMany({
          data: validated.courseIds.map((courseId) => ({
            groupId: validated.id,
            courseId,
          })),
        });
      }
    });

    revalidatePath("/admin/groups");
    revalidatePath(`/admin/groups/${validated.id}`);
    return success({ id: validated.id });
  } catch (error) {
    logError("updateStudentGroup", error, { groupId: input.id });
    return handleActionError(error);
  }
}

/**
 * Delete a student group
 */
export async function deleteStudentGroup(
  id: number
): Promise<ActionResult> {
  try {
    // Check if student group exists
    const studentGroup = await prisma.studentGroup.findUnique({
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

    assertExists(studentGroup, "Student group");

    // Check if student group has assignments
    if (studentGroup._count.assignments > 0) {
      return {
        success: false,
        error: `Cannot delete student group "${studentGroup.name}" because it has ${studentGroup._count.assignments} assignment(s) in timetables. Please remove the assignments first.`,
      };
    }

    // Delete student group (cascade will handle course associations)
    await prisma.studentGroup.delete({
      where: { id },
    });

    revalidatePath("/admin/groups");
    return success();
  } catch (error) {
    logError("deleteStudentGroup", error, { groupId: id });
    return handleActionError(error);
  }
}
