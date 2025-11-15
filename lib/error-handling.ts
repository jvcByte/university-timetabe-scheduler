/**
 * Centralized error handling utilities for the application
 * Provides consistent error handling patterns across server actions and API routes
 */

import { z } from "zod";
import { Prisma } from "@prisma/client";

// ============================================================================
// Error Types and Interfaces
// ============================================================================

/**
 * Standard action result type for server actions
 */
export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
};

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Application error codes for categorizing errors
 */
export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Database errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  FOREIGN_KEY_CONSTRAINT = "FOREIGN_KEY_CONSTRAINT",
  UNIQUE_CONSTRAINT = "UNIQUE_CONSTRAINT",
  DATABASE_ERROR = "DATABASE_ERROR",

  // Authorization errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // Business logic errors
  CONFLICT = "CONFLICT",
  DEPENDENCY_EXISTS = "DEPENDENCY_EXISTS",
  INVALID_STATE = "INVALID_STATE",

  // External service errors
  SOLVER_ERROR = "SOLVER_ERROR",
  SOLVER_TIMEOUT = "SOLVER_TIMEOUT",
  SOLVER_CONNECTION_ERROR = "SOLVER_CONNECTION_ERROR",

  // Generic errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Application error class with additional context
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ============================================================================
// Error Parsing and Formatting
// ============================================================================

/**
 * Parse Zod validation errors into user-friendly format
 */
export function parseZodError(error: z.ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Parse Prisma errors into user-friendly messages
 */
export function parsePrismaError(error: unknown): {
  message: string;
  code: ErrorCode;
} {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        const target = (error.meta?.target as string[]) || [];
        const field = target[0] || "field";
        return {
          message: `A record with this ${field} already exists`,
          code: ErrorCode.UNIQUE_CONSTRAINT,
        };

      case "P2003":
        // Foreign key constraint violation
        return {
          message: "Referenced record does not exist",
          code: ErrorCode.FOREIGN_KEY_CONSTRAINT,
        };

      case "P2025":
        // Record not found
        return {
          message: "Record not found",
          code: ErrorCode.NOT_FOUND,
        };

      case "P2014":
        // Required relation violation
        return {
          message: "Cannot delete record because it has related records",
          code: ErrorCode.DEPENDENCY_EXISTS,
        };

      default:
        return {
          message: "Database operation failed",
          code: ErrorCode.DATABASE_ERROR,
        };
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      message: "Invalid data provided",
      code: ErrorCode.VALIDATION_ERROR,
    };
  }

  return {
    message: "Database error occurred",
    code: ErrorCode.DATABASE_ERROR,
  };
}

/**
 * Get user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof z.ZodError) {
    return error.errors[0]?.message || "Validation error";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return parsePrismaError(error).message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Get error code from any error type
 */
export function getErrorCode(error: unknown): ErrorCode {
  if (error instanceof AppError) {
    return error.code;
  }

  if (error instanceof z.ZodError) {
    return ErrorCode.VALIDATION_ERROR;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return parsePrismaError(error).code;
  }

  return ErrorCode.UNKNOWN_ERROR;
}

// ============================================================================
// Error Handling Wrappers
// ============================================================================

/**
 * Wrap server action with comprehensive error handling
 * Automatically catches and formats errors into ActionResult
 */
export function withErrorHandling<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResult<TOutput>>,
  options?: {
    logErrors?: boolean;
    customErrorHandler?: (error: unknown) => ActionResult<TOutput>;
  }
): (input: TInput) => Promise<ActionResult<TOutput>> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    try {
      return await action(input);
    } catch (error) {
      // Log error if enabled
      if (options?.logErrors !== false) {
        console.error("Server action error:", error);
      }

      // Use custom error handler if provided
      if (options?.customErrorHandler) {
        return options.customErrorHandler(error);
      }

      // Default error handling
      return handleActionError<TOutput>(error);
    }
  };
}

/**
 * Handle errors in server actions and return formatted ActionResult
 */
export function handleActionError<T>(error: unknown): ActionResult<T> {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors[0]?.message || "Validation error",
      errors: parseZodError(error),
    };
  }

  // Handle Prisma errors
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    const { message } = parsePrismaError(error);
    return {
      success: false,
      error: message,
    };
  }

  // Handle application errors
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message || "An error occurred",
    };
  }

  // Unknown error type
  return {
    success: false,
    error: "An unexpected error occurred",
  };
}

/**
 * Create a success result
 */
export function success<T>(data?: T): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create an error result
 */
export function error<T>(
  message: string,
  errors?: ValidationError[]
): ActionResult<T> {
  return {
    success: false,
    error: message,
    errors,
  };
}

// ============================================================================
// Specific Error Handlers
// ============================================================================

/**
 * Handle solver service errors
 */
export function handleSolverError(error: unknown): {
  message: string;
  code: ErrorCode;
  details?: string;
} {
  if (error instanceof Error) {
    // Check for specific solver error types
    if (error.name === "SolverTimeoutError") {
      return {
        message: "Timetable generation timed out",
        code: ErrorCode.SOLVER_TIMEOUT,
        details:
          "The solver took too long to find a solution. Try reducing the problem size or increasing the time limit.",
      };
    }

    if (error.name === "SolverConnectionError") {
      return {
        message: "Cannot connect to solver service",
        code: ErrorCode.SOLVER_CONNECTION_ERROR,
        details:
          "The solver service is unavailable. Please check that it is running and try again.",
      };
    }

    if (error.name === "SolverAPIError") {
      return {
        message: "Solver service error",
        code: ErrorCode.SOLVER_ERROR,
        details: error.message,
      };
    }

    return {
      message: error.message,
      code: ErrorCode.SOLVER_ERROR,
    };
  }

  return {
    message: "Solver service error",
    code: ErrorCode.SOLVER_ERROR,
  };
}

/**
 * Handle dependency check errors (e.g., cannot delete because of related records)
 */
export function handleDependencyError(
  entityName: string,
  entityIdentifier: string,
  dependencyType: string,
  count: number
): ActionResult {
  return {
    success: false,
    error: `Cannot delete ${entityName} "${entityIdentifier}" because it has ${count} ${dependencyType}. Please remove the ${dependencyType} first.`,
  };
}

/**
 * Handle duplicate entry errors
 */
export function handleDuplicateError(
  entityName: string,
  field: string,
  value: string
): ActionResult {
  return {
    success: false,
    error: `${entityName} with ${field} "${value}" already exists`,
  };
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(entityName: string): ActionResult {
  return {
    success: false,
    error: `${entityName} not found`,
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate input with Zod schema and return formatted result
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ActionResult } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: {
      success: false,
      error: result.error.errors[0]?.message || "Validation error",
      errors: parseZodError(result.error),
    },
  };
}

/**
 * Assert that a value exists, throw AppError if not
 */
export function assertExists<T>(
  value: T | null | undefined,
  entityName: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new AppError(`${entityName} not found`, ErrorCode.NOT_FOUND, 404);
  }
}

/**
 * Assert that a condition is true, throw AppError if not
 */
export function assert(
  condition: boolean,
  message: string,
  code: ErrorCode = ErrorCode.INVALID_STATE
): asserts condition {
  if (!condition) {
    throw new AppError(message, code, 400);
  }
}

// ============================================================================
// Logging Utilities
// ============================================================================

/**
 * Log error with context
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, any>
): void {
  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);

  console.error(`[${context}] Error:`, {
    message: errorMessage,
    code: errorCode,
    error: error instanceof Error ? error.stack : error,
    ...additionalInfo,
  });
}

/**
 * Log warning with context
 */
export function logWarning(
  context: string,
  message: string,
  additionalInfo?: Record<string, any>
): void {
  console.warn(`[${context}] Warning:`, {
    message,
    ...additionalInfo,
  });
}

/**
 * Log info with context
 */
export function logInfo(
  context: string,
  message: string,
  additionalInfo?: Record<string, any>
): void {
  console.log(`[${context}] Info:`, {
    message,
    ...additionalInfo,
  });
}

// ============================================================================
// Error Boundary Helpers
// ============================================================================

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return [
      ErrorCode.SOLVER_TIMEOUT,
      ErrorCode.SOLVER_CONNECTION_ERROR,
      ErrorCode.DATABASE_ERROR,
    ].includes(error.code);
  }

  if (error instanceof Error) {
    return ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"].some((code) =>
      error.message.includes(code)
    );
  }

  return false;
}

/**
 * Get retry delay based on attempt number (exponential backoff)
 */
export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    shouldRetry = isRetryableError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts - 1 && shouldRetry(error)) {
        const delay = getRetryDelay(attempt, baseDelay);
        logWarning("Retry", `Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
          error: getErrorMessage(error),
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  throw lastError;
}
