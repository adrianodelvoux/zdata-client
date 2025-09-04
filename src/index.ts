/**
 * @fileoverview zdata-client - TypeScript client library for zdata backend API
 *
 * A modern, type-safe client library providing authentication and full CRUD operations
 * for the zdata backend API with comprehensive error handling and developer experience.
 *
 * @version 1.0.0
 * @author zdata-client
 * @license MIT
 */

// =============================================================================
// MAIN CLIENT EXPORT
// =============================================================================

export {
  ZDataClient,
  ExternalApiClient, // Legacy alias for backward compatibility
} from "./client.js";

// =============================================================================
// BASE CLIENT EXPORTS
// =============================================================================

export { BaseDataSourceClient, DataSourceClient } from "./base-client.js";

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Configuration types
  ApiConfig,
  FindRecordsParams,

  // Authentication types
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,

  // Response types
  PaginatedResponse,
  PaginationMeta,

  // Entity types
  BaseEntity,
  CreateEntity,
  EntityWithBase,

  // Error types
  ApiError,
  ValidationErrorDetail,

  // Interface
  IApiClient,
} from "./types.js";

// =============================================================================
// ERROR CLASS EXPORTS
// =============================================================================

export {
  // Error classes
  ApiClientError,
  InvalidCredentialsError,
  ValidationError,

  // Type guards
  isApiClientError,
  isInvalidCredentialsError,
  isValidationError,
} from "./types.js";

// =============================================================================
// CONVENIENCE FACTORY FUNCTION
// =============================================================================

import { ZDataClient } from "./client.js";
import type { ApiConfig } from "./types.js";

/**
 * Factory function to create a new zdata API client instance
 *
 * This is a convenience function that provides an alternative way to instantiate
 * the client without using the `new` keyword.
 *
 * @param config - Client configuration options
 * @returns A new ZDataClient instance
 * @throws {Error} When configuration is invalid
 *
 * @example
 * ```typescript
 * import { createClient } from 'zdata-client';
 *
 * const client = createClient({
 *   baseUrl: 'https://api.example.com',
 *   workspaceId: 'workspace-123'
 * });
 *
 * await client.login({ email: 'user@example.com', password: 'password' });
 * ```
 */
export function createClient(config: ApiConfig): ZDataClient {
  return new ZDataClient(config);
}

/**
 * Legacy factory function name for backward compatibility
 * @deprecated Use createClient instead
 */
export const createApiClient = createClient;

// =============================================================================
// VERSION EXPORT
// =============================================================================

/**
 * Current version of the zdata-client library
 */
export const VERSION = "1.0.0";

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export - ZDataClient class
 */
export default ZDataClient;
