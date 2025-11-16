import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  ErrorCode,
  AppError,
  parseZodError,
  parsePrismaError,
  getErrorMessage,
  getErrorCode,
  handleActionError,
  success,
  error,
  handleSolverError,
  handleDependencyError,
  handleDuplicateError,
  handleNotFoundError,
  validateInput,
  assertExists,
  assert,
  isRetryableError,
  getRetryDelay,
  withRetry,
} from '../error-handling';

describe('AppError', () => {
  it('should create an AppError with default values', () => {
    const error = new AppError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('AppError');
  });

  it('should create an AppError with custom values', () => {
    const error = new AppError(
      'Not found',
      ErrorCode.NOT_FOUND,
      404,
      { id: 123 }
    );
    expect(error.message).toBe('Not found');
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.statusCode).toBe(404);
    expect(error.details).toEqual({ id: 123 });
  });
});

describe('parseZodError', () => {
  it('should parse Zod validation errors', () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    const result = schema.safeParse({ email: 'invalid', age: 10 });
    if (!result.success) {
      const errors = parseZodError(result.error);
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('email');
      expect(errors[1].field).toBe('age');
    }
  });

  it('should handle nested field paths', () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(2),
      }),
    });

    const result = schema.safeParse({ user: { name: 'a' } });
    if (!result.success) {
      const errors = parseZodError(result.error);
      expect(errors[0].field).toBe('user.name');
    }
  });
});

describe('parsePrismaError', () => {
  it('should parse unique constraint violation', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] },
      }
    );

    const result = parsePrismaError(prismaError);
    expect(result.code).toBe(ErrorCode.UNIQUE_CONSTRAINT);
    expect(result.message).toContain('email');
  });

  it('should parse foreign key constraint violation', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed',
      {
        code: 'P2003',
        clientVersion: '5.0.0',
      }
    );

    const result = parsePrismaError(prismaError);
    expect(result.code).toBe(ErrorCode.FOREIGN_KEY_CONSTRAINT);
    expect(result.message).toContain('does not exist');
  });

  it('should parse record not found', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Record not found',
      {
        code: 'P2025',
        clientVersion: '5.0.0',
      }
    );

    const result = parsePrismaError(prismaError);
    expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(result.message).toContain('not found');
  });

  it('should parse dependency exists error', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Required relation violation',
      {
        code: 'P2014',
        clientVersion: '5.0.0',
      }
    );

    const result = parsePrismaError(prismaError);
    expect(result.code).toBe(ErrorCode.DEPENDENCY_EXISTS);
  });

  it('should handle validation error', () => {
    const prismaError = new Prisma.PrismaClientValidationError(
      'Validation failed',
      { clientVersion: '5.0.0' }
    );

    const result = parsePrismaError(prismaError);
    expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('should handle unknown Prisma error', () => {
    const result = parsePrismaError(new Error('Unknown error'));
    expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
  });
});

describe('getErrorMessage', () => {
  it('should get message from AppError', () => {
    const error = new AppError('Custom error');
    expect(getErrorMessage(error)).toBe('Custom error');
  });

  it('should get message from Zod error', () => {
    const schema = z.string().email();
    const result = schema.safeParse('invalid');
    if (!result.success) {
      const message = getErrorMessage(result.error);
      expect(message).toContain('email');
    }
  });

  it('should get message from Prisma error', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Error',
      {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] },
      }
    );
    const message = getErrorMessage(prismaError);
    expect(message).toContain('already exists');
  });

  it('should get message from standard Error', () => {
    const error = new Error('Standard error');
    expect(getErrorMessage(error)).toBe('Standard error');
  });

  it('should handle unknown error types', () => {
    const message = getErrorMessage('string error');
    expect(message).toBe('An unexpected error occurred');
  });
});

describe('getErrorCode', () => {
  it('should get code from AppError', () => {
    const error = new AppError('Error', ErrorCode.NOT_FOUND);
    expect(getErrorCode(error)).toBe(ErrorCode.NOT_FOUND);
  });

  it('should return VALIDATION_ERROR for Zod errors', () => {
    const schema = z.string();
    const result = schema.safeParse(123);
    if (!result.success) {
      expect(getErrorCode(result.error)).toBe(ErrorCode.VALIDATION_ERROR);
    }
  });

  it('should return appropriate code for Prisma errors', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Error',
      {
        code: 'P2002',
        clientVersion: '5.0.0',
      }
    );
    expect(getErrorCode(prismaError)).toBe(ErrorCode.UNIQUE_CONSTRAINT);
  });

  it('should return UNKNOWN_ERROR for unknown types', () => {
    expect(getErrorCode('unknown')).toBe(ErrorCode.UNKNOWN_ERROR);
  });
});

describe('handleActionError', () => {
  it('should handle Zod validation error', () => {
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse({ email: 'invalid' });
    
    if (!result.success) {
      const actionResult = handleActionError(result.error);
      expect(actionResult.success).toBe(false);
      expect(actionResult.error).toBeDefined();
      expect(actionResult.errors).toBeDefined();
    }
  });

  it('should handle Prisma error', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Error',
      {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] },
      }
    );

    const result = handleActionError(prismaError);
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('should handle AppError', () => {
    const error = new AppError('Custom error', ErrorCode.CONFLICT);
    const result = handleActionError(error);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Custom error');
  });

  it('should handle standard Error', () => {
    const error = new Error('Standard error');
    const result = handleActionError(error);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Standard error');
  });

  it('should handle unknown error types', () => {
    const result = handleActionError('unknown');
    expect(result.success).toBe(false);
    expect(result.error).toBe('An unexpected error occurred');
  });
});

describe('success and error helpers', () => {
  it('should create success result with data', () => {
    const result = success({ id: 1, name: 'Test' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 1, name: 'Test' });
  });

  it('should create success result without data', () => {
    const result = success();
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('should create error result', () => {
    const result = error('Error message');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Error message');
  });

  it('should create error result with validation errors', () => {
    const validationErrors = [
      { field: 'email', message: 'Invalid email' },
    ];
    const result = error('Validation failed', validationErrors);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(result.errors).toEqual(validationErrors);
  });
});

describe('handleSolverError', () => {
  it('should handle timeout error', () => {
    const error = new Error('Timeout');
    error.name = 'SolverTimeoutError';
    
    const result = handleSolverError(error);
    expect(result.code).toBe(ErrorCode.SOLVER_TIMEOUT);
    expect(result.message).toContain('timed out');
  });

  it('should handle connection error', () => {
    const error = new Error('Connection failed');
    error.name = 'SolverConnectionError';
    
    const result = handleSolverError(error);
    expect(result.code).toBe(ErrorCode.SOLVER_CONNECTION_ERROR);
    expect(result.message).toContain('connect');
  });

  it('should handle API error', () => {
    const error = new Error('API error');
    error.name = 'SolverAPIError';
    
    const result = handleSolverError(error);
    expect(result.code).toBe(ErrorCode.SOLVER_ERROR);
    expect(result.details).toBe('API error');
  });

  it('should handle generic error', () => {
    const error = new Error('Generic error');
    const result = handleSolverError(error);
    expect(result.code).toBe(ErrorCode.SOLVER_ERROR);
  });

  it('should handle unknown error types', () => {
    const result = handleSolverError('unknown');
    expect(result.code).toBe(ErrorCode.SOLVER_ERROR);
  });
});

describe('specific error handlers', () => {
  it('should handle dependency error', () => {
    const result = handleDependencyError('Course', 'CS101', 'assignments', 5);
    expect(result.success).toBe(false);
    expect(result.error).toContain('CS101');
    expect(result.error).toContain('5');
    expect(result.error).toContain('assignments');
  });

  it('should handle duplicate error', () => {
    const result = handleDuplicateError('Course', 'code', 'CS101');
    expect(result.success).toBe(false);
    expect(result.error).toContain('CS101');
    expect(result.error).toContain('already exists');
  });

  it('should handle not found error', () => {
    const result = handleNotFoundError('Course');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});

describe('validateInput', () => {
  it('should return success for valid input', () => {
    const schema = z.object({ name: z.string() });
    const result = validateInput(schema, { name: 'Test' });
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test');
    }
  });

  it('should return error for invalid input', () => {
    const schema = z.object({ name: z.string() });
    const result = validateInput(schema, { name: 123 });
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.success).toBe(false);
      expect(result.error.error).toBeDefined();
    }
  });
});

describe('assertExists', () => {
  it('should not throw for existing value', () => {
    expect(() => assertExists('value', 'Item')).not.toThrow();
    expect(() => assertExists(0, 'Item')).not.toThrow();
    expect(() => assertExists(false, 'Item')).not.toThrow();
  });

  it('should throw for null', () => {
    expect(() => assertExists(null, 'Item')).toThrow(AppError);
    expect(() => assertExists(null, 'Item')).toThrow('Item not found');
  });

  it('should throw for undefined', () => {
    expect(() => assertExists(undefined, 'Item')).toThrow(AppError);
  });

  it('should throw with correct error code', () => {
    try {
      assertExists(null, 'Item');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      if (error instanceof AppError) {
        expect(error.code).toBe(ErrorCode.NOT_FOUND);
        expect(error.statusCode).toBe(404);
      }
    }
  });
});

describe('assert', () => {
  it('should not throw for true condition', () => {
    expect(() => assert(true, 'Error')).not.toThrow();
    expect(() => assert(1 === 1, 'Error')).not.toThrow();
  });

  it('should throw for false condition', () => {
    expect(() => assert(false, 'Error message')).toThrow(AppError);
    expect(() => assert(false, 'Error message')).toThrow('Error message');
  });

  it('should use custom error code', () => {
    try {
      assert(false, 'Error', ErrorCode.CONFLICT);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      if (error instanceof AppError) {
        expect(error.code).toBe(ErrorCode.CONFLICT);
      }
    }
  });
});

describe('isRetryableError', () => {
  it('should identify retryable AppErrors', () => {
    expect(isRetryableError(new AppError('Error', ErrorCode.SOLVER_TIMEOUT))).toBe(true);
    expect(isRetryableError(new AppError('Error', ErrorCode.SOLVER_CONNECTION_ERROR))).toBe(true);
    expect(isRetryableError(new AppError('Error', ErrorCode.DATABASE_ERROR))).toBe(true);
  });

  it('should identify non-retryable AppErrors', () => {
    expect(isRetryableError(new AppError('Error', ErrorCode.VALIDATION_ERROR))).toBe(false);
    expect(isRetryableError(new AppError('Error', ErrorCode.NOT_FOUND))).toBe(false);
  });

  it('should identify retryable connection errors', () => {
    expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
    expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
    expect(isRetryableError(new Error('ENOTFOUND'))).toBe(true);
  });

  it('should identify non-retryable errors', () => {
    expect(isRetryableError(new Error('Generic error'))).toBe(false);
    expect(isRetryableError('string error')).toBe(false);
  });
});

describe('getRetryDelay', () => {
  it('should calculate exponential backoff', () => {
    expect(getRetryDelay(0, 1000)).toBe(1000);
    expect(getRetryDelay(1, 1000)).toBe(2000);
    expect(getRetryDelay(2, 1000)).toBe(4000);
    expect(getRetryDelay(3, 1000)).toBe(8000);
  });

  it('should cap at maximum delay', () => {
    expect(getRetryDelay(10, 1000)).toBe(30000);
    expect(getRetryDelay(20, 1000)).toBe(30000);
  });

  it('should use custom base delay', () => {
    expect(getRetryDelay(0, 500)).toBe(500);
    expect(getRetryDelay(1, 500)).toBe(1000);
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new AppError('Error', ErrorCode.SOLVER_TIMEOUT))
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, { maxAttempts: 3, baseDelay: 10 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-retryable error', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new AppError('Error', ErrorCode.VALIDATION_ERROR));
    
    await expect(withRetry(fn, { maxAttempts: 3 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw after max attempts', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new AppError('Error', ErrorCode.SOLVER_TIMEOUT));
    
    await expect(withRetry(fn, { maxAttempts: 3, baseDelay: 10 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use custom shouldRetry function', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Custom error'))
      .mockResolvedValue('success');
    
    const shouldRetry = (error: unknown) => 
      error instanceof Error && error.message === 'Custom error';
    
    const result = await withRetry(fn, { 
      maxAttempts: 3, 
      baseDelay: 10,
      shouldRetry 
    });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
