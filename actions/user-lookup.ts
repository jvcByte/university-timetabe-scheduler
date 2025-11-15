"use server";

import { prisma } from "@/lib/db";

/**
 * Look up user by email and return their information
 */
export async function getUserByEmail(email: string) {
  try {
    if (!email || !email.includes("@")) {
      return { success: false, error: "Invalid email address" };
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        student: {
          select: {
            id: true,
            studentId: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "No user found with this email" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasStudentRecord: !!user.student,
        studentId: user.student?.studentId,
      },
    };
  } catch (error) {
    console.error("Error looking up user:", error);
    return { success: false, error: "Failed to look up user" };
  }
}
