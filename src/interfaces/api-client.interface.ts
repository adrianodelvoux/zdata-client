/**
 * @fileoverview Interface defining the contract for the API client
 */

import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  FindRecordsParams,
} from '../features/validation/schemas';
import type { PaginatedResponse } from '../repositories/resource-repository';
import type { CreateEntity, EntityWithBase } from '../base/base-client';

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
    data: CreateEntity<T>,
  ): Promise<EntityWithBase<T>>;

  /**
   * Find a single record by its ID
   * @template T - The entity type to retrieve
   * @param resourceName - Name of the resource
   * @param id - Record ID to find
   * @returns Promise resolving to the record
   * @throws {ApiClientError} When record is not found or API request fails
   */
  findRecordById<T = unknown>(
    resourceName: string,
    id: string,
  ): Promise<EntityWithBase<T>>;

  /**
   * Find multiple records with pagination and search
   * @template T - The entity type to retrieve
   * @param params - Search and pagination parameters
   * @returns Promise resolving to paginated results
   * @throws {ValidationError} When query parameters are invalid
   * @throws {ApiClientError} When API request fails
   */
  findRecords<T = unknown>(
    params: FindRecordsParams,
  ): Promise<PaginatedResponse<EntityWithBase<T>>>;

  /**
   * Update an existing record
   * @template T - The entity type to update
   * @param resourceName - Name of the resource
   * @param id - Record ID to update
   * @param data - Partial data to update
   * @returns Promise resolving to the updated record
   * @throws {ValidationError} When update data is invalid
   * @throws {ApiClientError} When record is not found or API request fails
   */
  updateRecord<T = unknown>(
    resourceName: string,
    id: string,
    data: Partial<CreateEntity<T>>,
  ): Promise<EntityWithBase<T>>;

  /**
   * Delete a record by its ID
   * @param resourceName - Name of the resource
   * @param id - Record ID to delete
   * @returns Promise resolving when record is deleted
   * @throws {ApiClientError} When record is not found or API request fails
   */
  deleteRecord(resourceName: string, id: string): Promise<void>;

  // Token management methods
  /**
   * Set the access token for authentication
   * @param token - JWT access token
   */
  setAccessToken(token: string): void;

  /**
   * Get the current access token
   * @returns Current access token or null if not set
   */
  getAccessToken(): string | null;
}
