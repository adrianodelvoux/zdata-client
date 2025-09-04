import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { Validator } from './validator';
import { ValidationError } from '../../core/errors/api-errors';

describe('Validator', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    age: z.number().min(0),
  });

  describe('validate', () => {
    it('should return validated data for valid input', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const result = Validator.validate(testSchema, validData);

      expect(result).toEqual(validData);
    });

    it('should throw ValidationError for invalid input', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: -1,
      };

      expect(() => Validator.validate(testSchema, invalidData)).toThrow(
        ValidationError,
      );
    });

    it('should include validation details in error', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: -1,
      };

      try {
        Validator.validate(testSchema, invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors).toHaveLength(3);
        expect(validationError.errors[0].path).toEqual(['name']);
        expect(validationError.errors[1].path).toEqual(['email']);
        expect(validationError.errors[2].path).toEqual(['age']);
      }
    });
  });

  describe('validateSafely', () => {
    it('should return success result for valid input', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const result = Validator.validateSafely(testSchema, validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should return error result for invalid input', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: -1,
      };

      const result = Validator.validateSafely(testSchema, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.errors).toHaveLength(3);
      }
    });
  });
});
