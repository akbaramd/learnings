// src/services/errors/ErrorTypes.ts
// Structured error types following Result pattern

export interface ErrorContext {
  readonly operation: string;
  readonly timestamp: Date;
  readonly userId?: string;
  readonly requestId?: string;
  readonly additionalData?: Record<string, unknown>;
}

export interface BaseError {
  readonly message: string;
  readonly code: string;
  readonly context: ErrorContext;
  readonly originalError?: unknown;
}

export class AuthenticationError implements BaseError {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly context: ErrorContext,
    public readonly originalError?: unknown
  ) {}

  static logoutFailed(context: ErrorContext, originalError?: unknown): AuthenticationError {
    return new AuthenticationError(
      'Logout operation failed',
      'AUTH_LOGOUT_FAILED',
      context,
      originalError
    );
  }

  static networkError(context: ErrorContext, originalError?: unknown): AuthenticationError {
    return new AuthenticationError(
      'Network error during authentication operation',
      'AUTH_NETWORK_ERROR',
      context,
      originalError
    );
  }

  static serverError(context: ErrorContext, originalError?: unknown): AuthenticationError {
    return new AuthenticationError(
      'Server error during authentication operation',
      'AUTH_SERVER_ERROR',
      context,
      originalError
    );
  }
}

export class ValidationError implements BaseError {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly context: ErrorContext,
    public readonly validationErrors: string[],
    public readonly originalError?: unknown
  ) {}

  static invalidRequest(context: ErrorContext, validationErrors: string[], originalError?: unknown): ValidationError {
    return new ValidationError(
      'Invalid request parameters',
      'VALIDATION_INVALID_REQUEST',
      context,
      validationErrors,
      originalError
    );
  }
}

export class UnexpectedError implements BaseError {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly context: ErrorContext,
    public readonly originalError?: unknown
  ) {}

  static unknown(context: ErrorContext, originalError?: unknown): UnexpectedError {
    return new UnexpectedError(
      'An unexpected error occurred',
      'UNEXPECTED_ERROR',
      context,
      originalError
    );
  }
}

export type AppError = AuthenticationError | ValidationError | UnexpectedError;

// Result pattern for explicit error handling
export type Result<T, E extends AppError = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const createSuccess = <T>(data: T): Result<T> => ({ success: true, data });
export const createError = <E extends AppError>(error: E): Result<never, E> => ({ success: false, error });
