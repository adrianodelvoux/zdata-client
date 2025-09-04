// Main client export
export { ZDataClient } from './services/zdata-client';
export type { ZDataClientConfig } from './services/zdata-client';

// Legacy client for backward compatibility
export { ZDataClient as ExternalApiClient } from './services/zdata-client';

// Base classes for custom implementations
export { BaseDataSourceClient, DataSourceClient } from './base/base-client';
export type { CreateEntity, EntityWithBase } from './base/base-client';

// Core types from validation schemas
export type {
  ApiConfig,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  FindRecordsParams,
  BaseEntity,
  PaginationMeta,
  User,
  ApiError,
} from './features/validation/schemas';

// Repository types
export type { PaginatedResponse } from './repositories/resource-repository';

// Error classes and type guards
export {
  ApiClientError,
  InvalidCredentialsError,
  ValidationError,
  isApiClientError,
  isInvalidCredentialsError,
  isValidationError,
} from './core/errors/api-errors';

export type { ValidationErrorDetail } from './core/errors/api-errors';

// HTTP client interfaces for advanced usage
export type {
  HttpClient,
  HttpRequest,
  HttpResponse,
} from './core/http/http-client.interface';
export { AxiosHttpClient } from './core/http/axios-http-client';

// Cache interfaces for advanced usage
export type {
  Cache,
  CacheConfig,
  CacheStrategy,
} from './features/cache/cache.interface';
export { MemoryCache } from './features/cache/memory-cache';

// Validation utilities
export { Validator } from './features/validation/validator';
export {
  ApiConfigSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  FindRecordsParamsSchema,
  BaseEntitySchema,
  PaginationMetaSchema,
  AuthResponseSchema,
  UserSchema,
  ApiErrorSchema,
} from './features/validation/schemas';

// Retry utilities
export { RetryPolicy } from './features/retry/retry-policy';
export type { RetryConfig } from './features/retry/retry-policy';

// API client interface for backward compatibility
export type { IApiClient } from './interfaces/api-client.interface';

// Factory function
import { ZDataClient, type ZDataClientConfig } from './services/zdata-client';
export function createClient(config: ZDataClientConfig): ZDataClient {
  return new ZDataClient(config);
}

// Legacy factory function
export const createApiClient = createClient;

// Version
export const VERSION = '2.0.0';

// Default export
export default ZDataClient;
