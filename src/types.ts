/**
 * @fileoverview Type definitions for the zdata-client library
 */

// =============================================================================
// BASE ENTITY TYPES
// =============================================================================

/**
 * Base entity metadata that gets added by the database
 */
export interface BaseEntity {
  /** Unique identifier */
  readonly id: string;
  /** Creation timestamp */
  readonly created_at: string;
  /** Last update timestamp */
  readonly updated_at: string;
}

/**
 * Entity for creation (without database-generated fields)
 * @template T - The entity type without base fields
 */
export type CreateEntity<T> = Omit<T, keyof BaseEntity>;

/**
 * Entity returned from database (with all metadata)
 * @template T - The entity type
 */
export type EntityWithBase<T> = T & BaseEntity;

// =============================================================================
// PAGINATION TYPES
// =============================================================================

/**
 * Metadata for paginated responses
 */
export interface PaginationMeta {
  /** Current active page number (1-based) */
  readonly activePageNumber: number;
  /** Number of records per page */
  readonly limit: number;
  /** Total number of records available */
  readonly totalRecords: number;
  /** Total number of pages available */
  readonly totalPages: number;
  /** Whether there is a next page available */
  readonly hasNext: boolean;
  /** Whether there is a previous page available */
  readonly hasPrev: boolean;
}

/**
 * Generic paginated response structure
 * @template T - Type of the records in the response
 */
export interface PaginatedResponse<T = unknown> {
  /** Array of records for the current page */
  readonly records: readonly T[];
  /** Pagination metadata */
  readonly meta: PaginationMeta;
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

/**
 * Login request payload
 */
export interface LoginRequest {
  /** User's email address */
  readonly email: string;
  /** User's password */
  readonly password: string;
}

/**
 * User registration request payload
 */
export interface RegisterRequest {
  /** User's full name */
  readonly name: string;
  /** User's email address */
  readonly email: string;
  /** User's password */
  readonly password: string;
}

/**
 * User information returned from authentication
 */
export interface User {
  /** Unique user identifier */
  readonly id: string;
  /** User's email address */
  readonly email: string;
  /** User's full name */
  readonly name: string;
}

/**
 * Authentication response from login/register operations
 */
export interface AuthResponse {
  /** JWT access token for API authentication */
  readonly access_token: string;
  /** Token expiration time in seconds */
  readonly expires_in: number;
  /** Type of token (typically "Bearer") */
  readonly token_type: string;
  /** Authenticated user information */
  readonly user: User;
}

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

/**
 * Detailed validation error information
 */
export interface ValidationErrorDetail {
  /** Error code identifier */
  readonly code: string;
  /** JSON path to the field that caused the error */
  readonly path: readonly string[];
  /** Human-readable error message */
  readonly message: string;
}

/**
 * API error response structure
 */
export interface ApiError {
  /** Main error message */
  readonly message: string;
  /** Detailed validation errors (if applicable) */
  readonly errors?: readonly ValidationErrorDetail[];
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration options for the API client
 */
export interface ApiConfig {
  /** Base URL of the API server */
  readonly baseUrl: string;
  /** Workspace identifier for API requests */
  readonly workspaceId: string;
  /** Request timeout in milliseconds (default: 10000) */
  readonly timeout?: number;
  /** Additional HTTP headers to include in requests */
  readonly headers?: Readonly<Record<string, string>>;
}

/**
 * Parameters for finding records with pagination and search
 */
export interface FindRecordsParams {
  /** Name of the resource to query */
  readonly resourceName: string;
  /** Search query string (optional) */
  readonly search?: string;
  /** Page number (1-based, default: 1) */
  readonly page?: number;
  /** Number of records per page (default: 10) */
  readonly limit?: number;
}

// =============================================================================
// API CLIENT INTERFACE
// =============================================================================

/**
 * Interface defining the contract for the API client
 * Provides authentication and CRUD operations for the zdata backend
 */
export interface IApiClient {
  // Authentication methods
  /**
   * Authenticate user with email and password
   * @param credentials - User login credentials
   * @returns Promise resolving to authentication response
   * @throws {InvalidCredentialsError} When credentials are invalid
   * @throws {ApiClientError} When API request fails
   */
  login(credentials: LoginRequest): Promise<AuthResponse>;

  /**
   * Register a new user account
   * @param userData - User registration data
   * @returns Promise resolving to authentication response
   * @throws {ValidationError} When registration data is invalid
   * @throws {ApiClientError} When API request fails
   */
  register(userData: RegisterRequest): Promise<AuthResponse>;

  /**
   * Clear authentication token and log out user
   */
  logout(): void;

  /**
   * Check if user is currently authenticated
   * @returns True if user has a valid access token
   */
  isAuthenticated(): boolean;

  // CRUD methods
  /**
   * Create a new record in the specified resource
   * @template T - The entity type to create
   * @param resourceName - Name of the resource
   * @param data - Record data to create
   * @returns Promise resolving to the created record with base entity fields
   * @throws {ValidationError} When record data is invalid
   * @throws {ApiClientError} When API request fails
   */
  createRecord<T = unknown>(
    resourceName: string,
    data: CreateEntity<T>
  ): Promise<EntityWithBase<T>>;

  /**
   * Update an existing record
   * @template T - The entity type to update
   * @param resourceName - Name of the resource
   * @param id - Record identifier
   * @param data - Updated record data
   * @returns Promise resolving to the updated record with base entity fields
   * @throws {ValidationError} When record data is invalid
   * @throws {ApiClientError} When API request fails
   */
  updateRecord<T = unknown>(
    resourceName: string,
    id: string,
    data: Partial<CreateEntity<T>>
  ): Promise<EntityWithBase<T>>;

  /**
   * Delete a record by ID
   * @param resourceName - Name of the resource
   * @param id - Record identifier
   * @returns Promise that resolves when deletion is complete
   * @throws {ApiClientError} When API request fails
   */
  deleteRecord(resourceName: string, id: string): Promise<void>;

  /**
   * Find a specific record by ID
   * @template T - The entity type to return
   * @param resourceName - Name of the resource
   * @param id - Record identifier
   * @returns Promise resolving to the found record with base entity fields
   * @throws {ApiClientError} When record is not found or API request fails
   */
  findRecordById<T = unknown>(
    resourceName: string,
    id: string
  ): Promise<EntityWithBase<T>>;

  /**
   * Find records with pagination and optional search
   * @template T - The entity type to return
   * @param params - Query parameters including resource name, pagination, and search
   * @returns Promise resolving to paginated response with entities containing base fields
   * @throws {ApiClientError} When API request fails
   */
  findRecords<T = unknown>(
    params: FindRecordsParams
  ): Promise<PaginatedResponse<EntityWithBase<T>>>;

  // Token management
  /**
   * Set the access token for authentication
   * @param token - JWT access token
   * @throws {Error} When token is invalid
   */
  setAccessToken(token: string): void;

  /**
   * Get the current access token
   * @returns Current access token or null if not authenticated
   */
  getAccessToken(): string | null;
}

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

/**
 * Error thrown when authentication credentials are invalid
 */
export class InvalidCredentialsError extends Error {
  public readonly name = "InvalidCredentialsError";

  constructor(message = "Invalid credentials") {
    super(message);
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

/**
 * Error thrown when request data fails validation
 */
export class ValidationError extends Error {
  public readonly name = "ValidationError";
  public readonly errors: readonly ValidationErrorDetail[];

  constructor(
    message = "Validation error",
    errors: readonly ValidationErrorDetail[] = []
  ) {
    super(message);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * General API client error for HTTP and network issues
 */
export class ApiClientError extends Error {
  public readonly name = "ApiClientError";
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if an error is an InvalidCredentialsError
 */
export function isInvalidCredentialsError(
  error: unknown
): error is InvalidCredentialsError {
  return error instanceof InvalidCredentialsError;
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard to check if an error is an ApiClientError
 */
export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
