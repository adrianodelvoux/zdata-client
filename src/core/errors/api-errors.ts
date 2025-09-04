export interface ValidationErrorDetail {
  readonly code: string;
  readonly path: readonly string[];
  readonly message: string;
}

export class InvalidCredentialsError extends Error {
  public readonly name = 'InvalidCredentialsError';

  public constructor(message = 'Invalid credentials') {
    super(message);
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class ValidationError extends Error {
  public readonly name = 'ValidationError';
  public readonly errors: readonly ValidationErrorDetail[];

  public constructor(
    message = 'Validation error',
    errors: readonly ValidationErrorDetail[] = [],
  ) {
    super(message);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class ApiClientError extends Error {
  public readonly name = 'ApiClientError';
  public readonly statusCode?: number;

  public constructor(message: string, statusCode?: number) {
    super(message);
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

export function isInvalidCredentialsError(
  error: unknown,
): error is InvalidCredentialsError {
  return error instanceof InvalidCredentialsError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
