"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const courseSchema = z.object({
  code: z
    .string()
    .min(2, "Course code must be at least 2 characters")
    .max(20, "Course code must be at most 20 characters")
    .regex(/^[A-Z0-9-]+$/, "Course code must contain only uppercase letters, numbers, and hyphens"),
  title: z
    .string()
    .min(3, "Course title must be at least 3 characters")
    .max(200, "Course title must be at most 200 characters"),
  duration: z
    .number()
    .int("Duration must be an integer")
    .min(30, "Duration must be at least 30 minutes")
    .max(300, "Duration must be at most 300 minutes"),
  credits: z
    .number()
    .int("Credits must be an integer")
    .min(1, "Credits must be at least 1")
    .max(10, "Credits must be at most 10"),
  departmentId: z
    .number()
    .int("Department ID must be an integer")
    .positive("Department must be selected"),
  roomType: z
    .string()
    .max(50, "Room type must be at most 50 characters")
    .optional()
    .nullable(),
  instructorIds: z.array(z.number().int()).optional().default([]),
  groupIds: z.array(z.number().int()).optional().default([]),
});

const updateCourseSchema = courseSchema.extend({
  id: z.number().int(),
});

// Result types
export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type CourseInput = z.infer<typeof courseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

/**
 * Create a new course
 */
export async function createCourse(
  input: CourseInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = courseSchema.parse(input);

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code: validated.code },
    });

    if (existingCourse) {
      return {
        success: false,
        error: `Course with code "${validated.code}" already exists`,
      };
    }

    // Create course with relations
    const course = await prisma.course.create({
      data: {
        code: validated.code,
        title: validated.title,
        duration: validated.duration,
        credits: validated.credits,
        departmentId: validated.departmentId,
        roomType: validated.roomType || null,
        instructors: {
          create: validated.instructorIds.map((instructorId) => ({
            instructorId,
            isPrimary: true,
          })),
        },
        groups: {
          create: validated.groupIds.map((groupId) => ({
            groupId,
          })),
        },
      },
    });

    revalidatePath("/admin/courses");
    return { success: true, data: { id: course.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    console.error("Failed to create course:", error);
    return {
      success: false,
      error: "Failed to create course. Please try again.",
    };
  }
}

/**
 * Update an existing course
 */
export async function updateCourse(
  input: UpdateCourseInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = updateCourseSchema.parse(input);

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: validated.id },
    });

    if (!existingCourse) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    // Check if code is being changed and if new code already exists
    if (validated.code !== existingCourse.code) {
      const codeExists = await prisma.course.findUnique({
        where: { code: validated.code },
      });

      if (codeExists) {
        return {
          success: false,
          error: `Course with code "${validated.code}" already exists`,
        };
      }
    }

    // Update course with relations
    await prisma.$transaction(async (tx) => {
      // Update course basic fields
      await tx.course.update({
        where: { id: validated.id },
        data: {
          code: validated.code,
          title: validated.title,
          duration: validated.duration,
          credits: validated.credits,
          departmentId: validated.departmentId,
          roomType: validated.roomType || null,
        },
      });

      // Update instructors - delete all and recreate
      await tx.courseInstructor.deleteMany({
        where: { courseId: validated.id },
      });

      if (validated.instructorIds.length > 0) {
        await tx.courseInstructor.createMany({
          data: validated.instructorIds.map((instructorId) => ({
            courseId: validated.id,
            instructorId,
            isPrimary: true,
          })),
        });
      }

      // Update groups - delete all and recreate
      await tx.courseGroup.deleteMany({
        where: { courseId: validated.id },
      });

      if (validated.groupIds.length > 0) {
        await tx.courseGroup.createMany({
          data: validated.groupIds.map((groupId) => ({
            courseId: validated.id,
            groupId,
          })),
        });
      }
    });

    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${validated.id}`);
    return { success: true, data: { id: validated.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    console.error("Failed to update course:", error);
    return {
      success: false,
      error: "Failed to update course. Please try again.",
    };
  }
}

/**
 * Delete a course
 */
export async function deleteCourse(
  id: number
): Promise<ActionResult> {
  try {
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

    if (!course) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    // Check if course has assignments
    if (course._count.assignments > 0) {
      return {
        success: false,
        error: `Cannot delete course "${course.code}" because it has ${course._count.assignments} assignment(s) in timetables. Please remove the assignments first.`,
      };
    }

    // Delete course (cascade will handle relations)
    await prisma.course.delete({
      where: { id },
    });

    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete course:", error);
    return {
      success: false,
      error: "Failed to delete course. Please try again.",
    };
  }
}
