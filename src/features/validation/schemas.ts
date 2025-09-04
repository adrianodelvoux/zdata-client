import { z } from 'zod';

// Validation Constants
const VALIDATION_LIMITS = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_LIMIT: 100,
} as const;

export const ApiConfigSchema = z.object({
  baseUrl: z.string().url('Base URL must be a valid URL'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  timeout: z.number().min(1).max(300000).optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(
      VALIDATION_LIMITS.MIN_PASSWORD_LENGTH,
      'Password must be at least 6 characters',
    ),
});

export const FindRecordsParamsSchema = z.object({
  resourceName: z.string().min(1, 'Resource name is required'),
  search: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(VALIDATION_LIMITS.MAX_LIMIT).optional(),
});

export const BaseEntitySchema = z.object({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const PaginationMetaSchema = z.object({
  activePageNumber: z.number(),
  limit: z.number(),
  totalRecords: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  recordSchema: T,
): z.ZodObject<{
  records: z.ZodArray<T>;
  meta: typeof PaginationMetaSchema;
}> =>
  z.object({
    records: z.array(recordSchema),
    meta: PaginationMetaSchema,
  });

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
  }),
});

// Additional schemas for backward compatibility
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

export const ApiErrorSchema = z.object({
  message: z.string(),
  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type FindRecordsParams = z.infer<typeof FindRecordsParamsSchema>;
export type BaseEntity = z.infer<typeof BaseEntitySchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type User = z.infer<typeof UserSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
