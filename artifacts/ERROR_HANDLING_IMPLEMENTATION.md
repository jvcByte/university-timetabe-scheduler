# Comprehensive Error Handling Implementation

## Overview

This document describes the comprehensive error handling implementation for the University Timetable Scheduler application. All server actions now follow consistent error handling patterns with proper logging, user-friendly error messages, and typed error results.

## Implementation Summary

### 1. Centralized Error Handling Utilities (`lib/error-handling.ts`)

The application uses a centralized error handling library that provides:

#### Error Types and Interfaces
- **ActionResult<T>**: Standard return type for all server actions
- **ValidationError**: Structured validation error details
- **ErrorCode**: Enumeration of application error codes
- **AppError**: Custom error class with additional context

#### Error Handling Functions
- **handleActionError()**: Converts any error to ActionResult format
- **parseZodError()**: Formats Zod validation errors
- **parsePrismaError()**: Formats Prisma database errors
- **handleSolverError()**: Handles solver service specific errors
- **validateInput()**: Validates input with Zod schemas

#### Logging Utilities
- **logError()**: Logs errors with context
- **logWarning()**: Logs warnings with context
- **logInfo()**: Logs informational messages
- **assertExists()**: Asserts value exists, throws AppError if not

#### Retry Logic
- **withRetry()**: Retries functions with exponential backoff
- **isRetryableError()**: Determines if error is retryable
- **getRetryDelay()**: Calculates exponential backoff delay

### 2. Server Actions Error Handling

All server actions in the `actions/` directory implement comprehensive error handling:

#### Authentication Actions (`actions/auth.ts`)
- ✅ Try-catch blocks around all operations
- ✅ Specific error messages for different AuthError types
- ✅ Logging of authentication events
- ✅ User-friendly error messages

**Example:**
```typescript
export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    // Validate input
    const validatedFields = loginSchema.safeParse({ email, password });
    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.errors[0]?.message };
    }

    // Attempt sign in
    await signIn("credentials", { email, password, redirect: false });
    logInfo("login", "User logged in successfully", { email });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      logError("login", error, { email, errorType: error.type });
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password..." };
        // ... other cases
      }
    }
    logError("login", error, { email });
    return { success: false, error: "An unexpected error occurred..." };
  }
}
```

#### Course Management (`actions/courses.ts`)
- ✅ Zod schema validation
- ✅ Duplicate checking with user-friendly messages
- ✅ Dependency checking before deletion
- ✅ Transaction handling for complex updates
- ✅ Comprehensive logging

#### Instructor Management (`actions/instructors.ts`)
- ✅ Availability validation
- ✅ User linking validation
- ✅ Dependency checking
- ✅ Error logging with context

#### Room Management (`actions/rooms.ts`)
- ✅ Unique constraint validation
- ✅ Assignment dependency checking
- ✅ User-friendly error messages

#### Student Group Management (`actions/student-groups.ts`)
- ✅ Course association handling
- ✅ User linking validation
- ✅ Transaction-based updates

#### Constraint Configuration (`actions/constraints.ts`)
- ✅ Custom validation for working hours
- ✅ Business logic validation
- ✅ Default configuration handling

#### Timetable Generation (`actions/timetables.ts`)
- ✅ Solver error handling with specific error types
- ✅ Transaction rollback on failure
- ✅ Progress logging
- ✅ User-friendly error messages for different failure scenarios
- ✅ Improved logging for faculty/student timetable retrieval

**Key improvements:**
```typescript
// Before
console.error("Failed to get faculty timetables:", error);
return { success: false, error: "Failed to get timetables" };

// After
logError("getPublishedTimetablesForFaculty", error, { instructorId });
return { 
  success: false, 
  error: "Failed to retrieve timetables. Please try again later." 
};
```

#### Local Timetable Generation (`actions/local-timetables.ts`)
- ✅ Data validation before solver execution
- ✅ AppError usage for business logic errors
- ✅ Comprehensive logging of solver progress
- ✅ Graceful error handling with status updates
- ✅ User-friendly error categorization

**Key improvements:**
```typescript
// Validate data with AppError
if (courses.length === 0) {
  throw new AppError(
    "No courses found. Please add courses before generating a timetable.",
    ErrorCode.INVALID_STATE,
    400
  );
}

// Log solver progress
logInfo("generateTimetableLocal", "Solver completed", {
  solveTimeSeconds: solveTimeSeconds.toFixed(2),
  assignmentCount: result.assignments.length,
  fitness: result.fitness.toFixed(2),
  violationCount: result.violations.length,
});
```

#### Import/Export (`actions/import-export.ts`)
- ✅ File parsing error handling
- ✅ Row-level validation with error details
- ✅ Batch operation error collection
- ✅ Detailed error reporting

#### Export (`actions/export.ts`)
- ✅ Data validation before export
- ✅ Filter label error handling
- ✅ Comprehensive logging

### 3. Solver Client Error Handling (`lib/solver-client.ts`)

The solver client implements robust error handling:

#### Custom Error Classes
- **SolverAPIError**: Base error for solver API issues
- **SolverTimeoutError**: Specific timeout errors
- **SolverConnectionError**: Connection failure errors

#### Retry Logic
- Exponential backoff with configurable parameters
- Automatic retry for retryable errors (5xx, timeouts, network errors)
- Maximum retry attempts with delay calculation
- Improved logging using centralized utilities

**Key improvements:**
```typescript
// Before
console.warn(`Solver API request failed...`);

// After
logWarning("SolverClient", `Request failed, retrying in ${delay}ms`, {
  attempt: attempt + 1,
  maxAttempts: this.retryOptions.maxRetries + 1,
  error: lastError.message,
  endpoint,
});
```

#### Request Handling
- Timeout configuration per request type
- Proper abort signal handling
- Detailed error context in exceptions

### 4. Error Message Guidelines

All error messages follow these principles:

#### User-Facing Messages
- Clear and actionable
- No technical jargon
- Suggest next steps when possible
- Context-specific

**Examples:**
- ❌ "P2002 constraint violation"
- ✅ "A course with code 'CS101' already exists"

- ❌ "Database error"
- ✅ "Cannot delete instructor 'John Doe' because they have 5 assignment(s) in timetables. Please remove the assignments first."

#### Log Messages
- Include relevant context (IDs, counts, etc.)
- Use structured logging format
- Categorize by severity (error, warning, info)

### 5. Error Handling Patterns

#### Pattern 1: Simple CRUD Operations
```typescript
export async function createEntity(input: Input): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = schema.parse(input);
    
    // Check for duplicates
    const existing = await prisma.entity.findUnique({ where: { ... } });
    if (existing) {
      return { success: false, error: "Entity already exists" };
    }
    
    // Create entity
    const entity = await prisma.entity.create({ data: validated });
    
    revalidatePath("/path");
    logInfo("createEntity", "Entity created", { id: entity.id });
    return success({ id: entity.id });
  } catch (error) {
    logError("createEntity", error, { input });
    return handleActionError(error);
  }
}
```

#### Pattern 2: Complex Operations with Transactions
```typescript
export async function updateEntity(input: Input): Promise<ActionResult> {
  try {
    const validated = schema.parse(input);
    
    await prisma.$transaction(async (tx) => {
      // Multiple operations
      await tx.entity.update({ ... });
      await tx.relatedEntity.deleteMany({ ... });
      await tx.relatedEntity.createMany({ ... });
    });
    
    revalidatePath("/path");
    return success();
  } catch (error) {
    logError("updateEntity", error, { input });
    return handleActionError(error);
  }
}
```

#### Pattern 3: External Service Calls
```typescript
export async function callExternalService(input: Input): Promise<Result> {
  try {
    // Validate input
    const validated = schema.parse(input);
    
    // Call external service with retry logic
    const result = await externalClient.call(validated);
    
    // Handle result
    if (!result.success) {
      return { success: false, error: result.message };
    }
    
    logInfo("callExternalService", "Service call successful");
    return { success: true, data: result.data };
  } catch (error) {
    logError("callExternalService", error, { input });
    const solverError = handleSolverError(error);
    return { success: false, error: solverError.message };
  }
}
```

### 6. Validation Error Handling

All inputs are validated using Zod schemas:

```typescript
const schema = z.object({
  field: z.string().min(2, "Field must be at least 2 characters"),
  // ... other fields
});

// In action
try {
  const validated = schema.parse(input);
  // ... use validated data
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors[0]?.message || "Validation error",
      errors: parseZodError(error),
    };
  }
  // ... other error handling
}
```

### 7. Database Error Handling

Prisma errors are automatically parsed into user-friendly messages:

```typescript
try {
  await prisma.entity.create({ data });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const { message } = parsePrismaError(error);
    return { success: false, error: message };
  }
  // ... other error handling
}
```

Common Prisma error codes handled:
- **P2002**: Unique constraint violation
- **P2003**: Foreign key constraint violation
- **P2025**: Record not found
- **P2014**: Required relation violation

## Testing Error Handling

To test error handling:

1. **Validation Errors**: Submit invalid data to forms
2. **Duplicate Errors**: Try creating entities with existing unique fields
3. **Dependency Errors**: Try deleting entities with related records
4. **Network Errors**: Disconnect solver service and attempt generation
5. **Timeout Errors**: Set very short time limits for generation

## Benefits

1. **Consistency**: All errors follow the same pattern
2. **User Experience**: Clear, actionable error messages
3. **Debugging**: Comprehensive logging with context
4. **Reliability**: Automatic retry for transient failures
5. **Type Safety**: Typed error results prevent runtime issues
6. **Maintainability**: Centralized error handling logic

## Future Improvements

1. Error monitoring integration (e.g., Sentry)
2. User-facing error tracking dashboard
3. Automated error recovery for common issues
4. Error analytics and reporting
5. Localization of error messages

## Conclusion

The application now has comprehensive error handling across all server actions, with:
- ✅ Try-catch blocks in all server actions
- ✅ Typed error results (ActionResult<T>)
- ✅ Centralized error handling utilities
- ✅ User-friendly error messages
- ✅ Comprehensive logging with context
- ✅ Retry logic for transient failures
- ✅ Proper validation error formatting
- ✅ Database error parsing
- ✅ Solver-specific error handling

All requirements from task 20.2 have been successfully implemented.
