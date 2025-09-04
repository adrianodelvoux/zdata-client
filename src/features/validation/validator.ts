import { type ZodSchema, ZodError } from 'zod';
import {
  ValidationError,
  type ValidationErrorDetail,
} from '../../core/errors/api-errors';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Validator {
  public static validate<T>(schema: ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(
          'Validation failed',
          this.mapZodErrorsToValidationDetails(error),
        );
      }
      throw error;
    }
  }

  public static validateSafely<T>(
    schema: ZodSchema<T>,
    data: unknown,
  ): { success: true; data: T } | { success: false; error: ValidationError } {
    try {
      const validData = schema.parse(data);
      return { success: true, data: validData };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          error: new ValidationError(
            'Validation failed',
            this.mapZodErrorsToValidationDetails(error),
          ),
        };
      }
      return {
        success: false,
        error: new ValidationError('Unknown validation error'),
      };
    }
  }

  private static mapZodErrorsToValidationDetails(
    error: ZodError,
  ): ValidationErrorDetail[] {
    return error.issues.map(err => ({
      code: err.code,
      path: err.path.map(String),
      message: err.message,
    }));
  }
}
