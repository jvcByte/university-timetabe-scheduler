import { env } from "./env";
import { logError, logWarning, logInfo } from "./error-handling";

// Types matching Python Pydantic models
export type Day =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface CourseInput {
  id: number;
  code: string;
  title: string;
  duration: number;
  department: string;
  room_type: string | null;
  instructor_ids: number[];
  group_ids: number[];
}

export interface InstructorInput {
  id: number;
  name: string;
  department: string;
  teaching_load: number;
  availability: Record<Day, string[]>;
  preferences?: Record<string, any> | null;
}

export interface RoomInput {
  id: number;
  name: string;
  capacity: number;
  type: string;
  equipment?: string[] | null;
}

export interface StudentGroupInput {
  id: number;
  name: string;
  size: number;
  course_ids: number[];
}

export interface ConstraintConfigInput {
  hard: Record<string, boolean>;
  soft: Record<string, number>;
  working_hours_start: string;
  working_hours_end: string;
}

export interface GenerationPayload {
  courses: CourseInput[];
  instructors: InstructorInput[];
  rooms: RoomInput[];
  groups: StudentGroupInput[];
  constraints: ConstraintConfigInput;
  time_limit_seconds?: number;
}

export interface AssignmentOutput {
  course_id: number;
  instructor_id: number;
  room_id: number;
  group_id: number;
  day: Day;
  start_time: string;
  end_time: string;
}

export interface ViolationDetail {
  constraint_type: string;
  severity: string;
  description: string;
  affected_assignments: number[];
}

export interface TimetableResult {
  success: boolean;
  assignments: AssignmentOutput[];
  fitness_score: number | null;
  violations: ViolationDetail[];
  solve_time_seconds: number;
  message: string;
}

export interface ValidationPayload {
  courses: CourseInput[];
  instructors: InstructorInput[];
  rooms: RoomInput[];
  groups: StudentGroupInput[];
  constraints: ConstraintConfigInput;
  assignments: AssignmentOutput[];
}

export interface ValidationResult {
  is_valid: boolean;
  conflicts: ViolationDetail[];
}

export class SolverAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "SolverAPIError";
  }
}

export class SolverTimeoutError extends SolverAPIError {
  constructor(message: string = "Solver request timed out") {
    super(message, 408);
    this.name = "SolverTimeoutError";
  }
}

export class SolverConnectionError extends SolverAPIError {
  constructor(message: string = "Failed to connect to solver service") {
    super(message);
    this.name = "SolverConnectionError";
  }
}

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(
  attempt: number,
  options: RetryOptions
): number {
  const delay =
    options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelayMs);
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Retry on network errors, timeouts, and 5xx server errors
  if (error instanceof SolverConnectionError) return true;
  if (error instanceof SolverTimeoutError) return true;
  if (error instanceof SolverAPIError) {
    const statusCode = error.statusCode;
    return statusCode ? statusCode >= 500 && statusCode < 600 : false;
  }
  return false;
}

/**
 * HTTP client for solver service with retry logic
 */
class SolverClient {
  private baseUrl: string;
  private apiKey: string;
  private retryOptions: RetryOptions;

  constructor(
    baseUrl?: string,
    apiKey?: string,
    retryOptions?: Partial<RetryOptions>
  ) {
    this.baseUrl = baseUrl || env.SOLVER_API_URL;
    this.apiKey = apiKey || env.SOLVER_API_KEY;
    this.retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };
  }

  /**
   * Make HTTP request with retry logic
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    timeoutMs: number = 330000 // 5.5 minutes (longer than solver timeout)
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        // Add timeout to fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey,
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorBody = await response.text();
          let errorDetails;
          try {
            errorDetails = JSON.parse(errorBody);
          } catch {
            errorDetails = errorBody;
          }

          throw new SolverAPIError(
            `Solver API error: ${response.statusText}`,
            response.status,
            errorDetails
          );
        }

        // Parse and return response
        const data = await response.json();
        return data as T;
      } catch (error: any) {
        // Handle abort/timeout
        if (error.name === "AbortError") {
          lastError = new SolverTimeoutError();
        }
        // Handle network errors
        else if (
          error instanceof TypeError &&
          error.message.includes("fetch")
        ) {
          lastError = new SolverConnectionError(
            `Failed to connect to solver service at ${this.baseUrl}`
          );
        }
        // Handle API errors
        else if (error instanceof SolverAPIError) {
          lastError = error;
        }
        // Handle unknown errors
        else {
          lastError = new SolverAPIError(
            error.message || "Unknown error occurred"
          );
        }

        // Check if we should retry
        const shouldRetry =
          attempt < this.retryOptions.maxRetries &&
          isRetryableError(lastError);

        if (shouldRetry) {
          const delay = calculateBackoffDelay(attempt, this.retryOptions);
          logWarning("SolverClient", `Request failed, retrying in ${delay}ms`, {
            attempt: attempt + 1,
            maxAttempts: this.retryOptions.maxRetries + 1,
            error: lastError.message,
            endpoint,
          });
          await sleep(delay);
        } else {
          logError("SolverClient", lastError, {
            endpoint,
            attempts: attempt + 1,
          });
          throw lastError;
        }
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError || new SolverAPIError("Request failed after all retries");
  }

  /**
   * Generate timetable
   */
  async generateTimetable(
    payload: GenerationPayload
  ): Promise<TimetableResult> {
    const timeoutMs = (payload.time_limit_seconds || 300) * 1000 + 30000; // Add 30s buffer

    return this.fetchWithRetry<TimetableResult>(
      "/api/v1/generate",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      timeoutMs
    );
  }

  /**
   * Validate timetable
   */
  async validateTimetable(
    payload: ValidationPayload
  ): Promise<ValidationResult> {
    return this.fetchWithRetry<ValidationResult>("/api/v1/validate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Check solver service health
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.fetchWithRetry<{ status: string }>(
      "/api/v1/health",
      {
        method: "GET",
      },
      5000 // 5 second timeout for health check
    );
  }
}

// Export singleton instance
export const solverClient = new SolverClient();

// Export class for testing
export { SolverClient };
