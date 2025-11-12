"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "FACULTY", "STUDENT"]).default("STUDENT"),
});

export type LoginResult = {
  success: boolean;
  error?: string;
};

export type RegisterResult = {
  success: boolean;
  error?: string;
  data?: { id: string; email: string };
};

export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const validatedFields = loginSchema.safeParse({ email, password });

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0].message,
      };
    }

    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password" };
        default:
          return { success: false, error: "Something went wrong" };
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "FACULTY" | "STUDENT";
}): Promise<RegisterResult> {
  try {
    const validatedFields = registerSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0].message,
      };
    }

    const { name, email, password, role } = validatedFields.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }
}
