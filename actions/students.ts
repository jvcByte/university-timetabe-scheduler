"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { safeValidate } from "@/lib/validation";
import { handleActionError } from "@/lib/error-handling";

// ============================================================================
// Validation Schemas (internal use only)
// ============================================================================

const studentSchema = z.object({
  studentId: z
    .string()
    .min(3, "Student ID must be at least 3 characters")
    .max(50, "Student ID must be at most 50 characters")
    .regex(/^[A-Z0-9-]+$/i, "Student ID must contain only letters, numbers, and hyphens"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters"),
  year: z.coerce.number().int().min(1).max(10).optional(),
  semester: z.coerce.number().int().min(1).max(2).optional(),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  studentGroupId: z.coerce.number().int().positive().optional().nullable(),
  userId: z.string().optional(),
});

const updateStudentSchema = studentSchema.extend({
  id: z.number().int().positive(),
});

type StudentInput = z.infer<typeof studentSchema>;
type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// ============================================================================
// Create Student
// ============================================================================

export async function createStudent(input: StudentInput) {
  try {
    console.log("Creating student with input:", input);
    
    const validation = safeValidate(studentSchema, input);
    if (!validation.success) {
      console.error("Validation failed:", validation.error);
      return { success: false, error: validation.error };
    }

    const data = validation.data;
    console.log("Validated data:", data);

    // Check if student ID already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId: data.studentId },
    });

    if (existingStudent) {
      return {
        success: false,
        error: "A student with this ID already exists",
      };
    }

    // Check if email already exists
    const existingEmail = await prisma.student.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      return {
        success: false,
        error: "A student with this email already exists",
      };
    }

    // If userId is provided, verify it exists and is a STUDENT role
    if (data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }

      if (user.role !== "STUDENT") {
        return { success: false, error: "User must have STUDENT role" };
      }

      // Check if user is already linked to a student
      const existingStudentUser = await prisma.student.findUnique({
        where: { userId: data.userId },
      });

      if (existingStudentUser) {
        return {
          success: false,
          error: "This user is already linked to another student",
        };
      }
    }

    // Create the student
    const student = await prisma.student.create({
      data: {
        studentId: data.studentId,
        name: data.name,
        email: data.email,
        year: data.year || null,
        semester: data.semester || null,
        departmentId: data.departmentId || null,
        studentGroupId: data.studentGroupId || null,
        userId: data.userId || null,
      },
      include: {
        department: true,
        group: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    revalidatePath("/admin/students");
    if (student.studentGroupId) {
      revalidatePath(`/admin/groups/${student.studentGroupId}`);
    }

    console.log("Student created successfully:", student.id);
    return { success: true, student };
  } catch (error) {
    console.error("Error creating student:", error);
    return handleActionError(error);
  }
}

// ============================================================================
// Update Student
// ============================================================================

export async function updateStudent(input: UpdateStudentInput) {
  try {
    const validation = safeValidate(updateStudentSchema, input);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const { id, ...data } = validation.data;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      return { success: false, error: "Student not found" };
    }

    // Check if student ID is being changed and if it conflicts
    if (data.studentId !== existingStudent.studentId) {
      const conflictingStudent = await prisma.student.findUnique({
        where: { studentId: data.studentId },
      });

      if (conflictingStudent) {
        return {
          success: false,
          error: "A student with this ID already exists",
        };
      }
    }

    // Check if email is being changed and if it conflicts
    if (data.email !== existingStudent.email) {
      const conflictingEmail = await prisma.student.findUnique({
        where: { email: data.email },
      });

      if (conflictingEmail) {
        return {
          success: false,
          error: "A student with this email already exists",
        };
      }
    }

    // Update the student
    const student = await prisma.student.update({
      where: { id },
      data: {
        studentId: data.studentId,
        name: data.name,
        email: data.email,
        year: data.year || null,
        semester: data.semester || null,
        departmentId: data.departmentId || null,
        studentGroupId: data.studentGroupId || null,
      },
      include: {
        department: true,
        group: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${id}`);
    if (student.studentGroupId) {
      revalidatePath(`/admin/groups/${student.studentGroupId}`);
    }
    if (existingStudent.studentGroupId && existingStudent.studentGroupId !== student.studentGroupId) {
      revalidatePath(`/admin/groups/${existingStudent.studentGroupId}`);
    }

    return { success: true, student };
  } catch (error) {
    return handleActionError(error);
  }
}

// ============================================================================
// Delete Student
// ============================================================================

export async function deleteStudent(id: number) {
  try {
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    await prisma.student.delete({
      where: { id },
    });

    revalidatePath("/admin/students");
    if (student.studentGroupId) {
      revalidatePath(`/admin/groups/${student.studentGroupId}`);
    }

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// ============================================================================
// Assign Student to Group
// ============================================================================

export async function assignStudentToGroup(studentId: number, groupId: number | null) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    if (groupId !== null) {
      const group = await prisma.studentGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return { success: false, error: "Student group not found" };
      }
    }

    const oldGroupId = student.studentGroupId;

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { studentGroupId: groupId },
      include: {
        group: true,
      },
    });

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${studentId}`);
    if (groupId) {
      revalidatePath(`/admin/groups/${groupId}`);
    }
    if (oldGroupId) {
      revalidatePath(`/admin/groups/${oldGroupId}`);
    }

    return { success: true, student: updatedStudent };
  } catch (error) {
    return handleActionError(error);
  }
}

// ============================================================================
// Bulk Assign Students to Group
// ============================================================================

export async function bulkAssignStudentsToGroup(studentIds: number[], groupId: number | null) {
  try {
    if (groupId !== null) {
      const group = await prisma.studentGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return { success: false, error: "Student group not found" };
      }
    }

    // Get old group IDs for revalidation
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { studentGroupId: true },
    });

    const oldGroupIds = [...new Set(students.map(s => s.studentGroupId).filter(Boolean))];

    await prisma.student.updateMany({
      where: { id: { in: studentIds } },
      data: { studentGroupId: groupId },
    });

    revalidatePath("/admin/students");
    if (groupId) {
      revalidatePath(`/admin/groups/${groupId}`);
    }
    oldGroupIds.forEach(oldGroupId => {
      if (oldGroupId) {
        revalidatePath(`/admin/groups/${oldGroupId}`);
      }
    });

    return { success: true, count: studentIds.length };
  } catch (error) {
    return handleActionError(error);
  }
}
