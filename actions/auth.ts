"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  handleActionError,
  logError,
  logInfo,
  type ActionResult,
} from "@/lib/error-handling";

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
  role?: "ADMIN" | "FACULTY" | "STUDENT";
};

export type RegisterResult = {
  success: boolean;
  error?: string;
  data?: { id: string; email: string };
};

/**
 * Authenticate user with email and password
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    // Validate input
    const validatedFields = loginSchema.safeParse({ email, password });

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message || "Invalid input",
      };
    }

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { email: validatedFields.data.email },
      select: { role: true },
    });

    // Attempt sign in
    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirect: false,
    });

    logInfo("login", "User logged in successfully", { email });
    return { success: true, role: user?.role };
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      logError("login", error, { email, errorType: error.type });
      
      switch (error.type) {
        case "CredentialsSignin":
          return { 
            success: false, 
            error: "Invalid email or password. Please check your credentials and try again." 
          };
        case "AccessDenied":
          return { 
            success: false, 
            error: "Access denied. Your account may be disabled." 
          };
        default:
          return { 
            success: false, 
            error: "Authentication failed. Please try again." 
          };
      }
    }
    
    // Handle unexpected errors
    logError("login", error, { email });
    return {
      success: false,
      error: "An unexpected error occurred during login. Please try again.",
    };
  }
}

/**
 * Sign out the current user
 */
export async function logout(): Promise<void> {
  try {
    await signOut({ redirectTo: "/login" });
    logInfo("logout", "User logged out successfully");
  } catch (error) {
    logError("logout", error);
    throw error;
  }
}

/**
 * Register a new user account
 */
export async function register(data: {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "FACULTY" | "STUDENT";
}): Promise<RegisterResult> {
  try {
    // Validate input
    const validatedFields = registerSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message || "Invalid input",
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
        error: "An account with this email address already exists. Please use a different email or try logging in.",
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

    logInfo("register", "User registered successfully", { 
      userId: user.id, 
      email: user.email, 
      role 
    });

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    logError("register", error, { email: data.email, role: data.role });
    
    // Return user-friendly error message
    return {
      success: false,
      error: "Failed to create account. Please try again later.",
    };
  }
}
