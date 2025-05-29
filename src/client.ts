/**
 * @fileoverview zdata API Client implementation
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
} from "axios";
import {
  ApiClientError,
  type ApiConfig,
  type ApiError,
  type AuthResponse,
  type FindRecordsParams,
  type IApiClient,
  InvalidCredentialsError,
  type LoginRequest,
  type PaginatedResponse,
  type RegisterRequest,
  ValidationError,
} from "./types.js";

// =============================================================================
// INTERNAL TYPES
// =============================================================================

interface RequestParams {
  readonly method: "get" | "post" | "put" | "delete";
  readonly endpoint: string;
  readonly data?: unknown;
  readonly searchParams?: Readonly<Record<string, string>>;
}

// =============================================================================
// API CLIENT IMPLEMENTATION
// =============================================================================

/**
 * zdata API Client for handling authentication and CRUD operations
 *
 * This client provides a complete interface to the zdata backend API,
 * including user authentication, token management, and full CRUD operations
 * for any resource with automatic error handling and type safety.
 *
 * @example
 * ```typescript
 * import { ZDataClient } from 'zdata-client';
 *
 * const client = new ZDataClient({
 *   baseUrl: 'https://api.example.com',
 *   workspaceId: 'workspace-123'
 * });
 *
 * // Authentication
 * await client.login({
 *   email: 'user@example.com',
 *   password: 'password'
 * });
 *
 * // CRUD operations
 * const users = await client.findRecords({
 *   resourceName: 'users',
 *   page: 1,
 *   limit: 10,
 *   search: 'john'
 * });
 *
 * const newUser = await client.createRecord('users', {
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
export class ZDataClient implements IApiClient {
  private readonly httpClient: AxiosInstance;
  private accessToken: string | null = null;

  /**
   * Create a new zdata API client instance
   * @param config - Client configuration options
   * @throws {Error} When configuration is invalid
   */
  constructor(config: ApiConfig) {
    this.validateConfig(config);
    this.httpClient = this.createHttpClient(config);
    this.setupInterceptors();
  }

  // =============================================================================
  // AUTHENTICATION METHODS
  // =============================================================================

  /**
   * Authenticate user with email and password
   *
   * @param credentials - User login credentials
   * @returns Promise resolving to authentication response with user data and token
   * @throws {InvalidCredentialsError} When email/password combination is invalid
   * @throws {ValidationError} When request data is malformed
   * @throws {ApiClientError} When API request fails
   *
   * @example
   * ```typescript
   * try {
   *   const auth = await client.login({
   *     email: 'user@example.com',
   *     password: 'securePassword123'
   *   });
   *   console.log('Logged in as:', auth.user.name);
   * } catch (error) {
   *   if (error instanceof InvalidCredentialsError) {
   *     console.error('Invalid email or password');
   *   }
   * }
   * ```
   */
  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    this.validateLoginCredentials(credentials);

    const response = await this.makeRequest({
      method: "post",
      endpoint: "/login",
      data: credentials,
    });

    this.setAccessToken(response.access_token);
    return response;
  }

  /**
   * Register a new user account
   *
   * @param userData - User registration data
   * @returns Promise resolving to authentication response with user data and token
   * @throws {ValidationError} When registration data is invalid
   * @throws {ApiClientError} When API request fails (e.g., email already exists)
   *
   * @example
   * ```typescript
   * try {
   *   const auth = await client.register({
   *     name: 'John Doe',
   *     email: 'john@example.com',
   *     password: 'securePassword123'
   *   });
   *   console.log('Registered user:', auth.user.name);
   * } catch (error) {
   *   if (error instanceof ValidationError) {
   *     console.error('Validation errors:', error.errors);
   *   }
   * }
   * ```
   */
  public async register(userData: RegisterRequest): Promise<AuthResponse> {
    this.validateRegisterData(userData);

    return this.makeRequest({
      method: "post",
      endpoint: "/register",
      data: userData,
    });
  }

  /**
   * Clear authentication token and log out user
   *
   * @example
   * ```typescript
   * client.logout();
   * console.log('User logged out');
   * ```
   */
  public logout(): void {
    this.accessToken = null;
  }

  /**
   * Check if user is currently authenticated
   *
   * @returns True if user has a valid access token
   *
   * @example
   * ```typescript
   * if (client.isAuthenticated()) {
   *   console.log('User is logged in');
   * } else {
   *   console.log('User needs to log in');
   * }
   * ```
   */
  public isAuthenticated(): boolean {
    return Boolean(this.accessToken);
  }

  // =============================================================================
  // CRUD METHODS
  // =============================================================================

  /**
   * Create a new record in the specified resource
   *
   * @param resourceName - Name of the resource (e.g., 'users', 'products')
   * @param data - Record data to create
   * @returns Promise resolving to the created record
   * @throws {ValidationError} When record data is invalid
   * @throws {ApiClientError} When API request fails
   *
   * @example
   * ```typescript
   * const newUser = await client.createRecord('users', {
   *   name: 'Jane Smith',
   *   email: 'jane@example.com',
   *   role: 'admin'
   * });
   * console.log('Created user with ID:', newUser.id);
   * ```
   */
  public async createRecord(
    resourceName: string,
    data: unknown
  ): Promise<unknown> {
    this.validateResourceName(resourceName);

    return this.makeRequest({
      method: "post",
      endpoint: `/${resourceName}`,
      data,
    });
  }

  /**
   * Update an existing record
   *
   * @param resourceName - Name of the resource
   * @param id - Record identifier
   * @param data - Updated record data (partial updates supported)
   * @returns Promise resolving to the updated record
   * @throws {ValidationError} When record data is invalid
   * @throws {ApiClientError} When record is not found or API request fails
   *
   * @example
   * ```typescript
   * const updatedUser = await client.updateRecord('users', 'user-123', {
   *   name: 'Jane Doe',
   *   role: 'superadmin'
   * });
   * console.log('Updated user:', updatedUser.name);
   * ```
   */
  public async updateRecord(
    resourceName: string,
    id: string,
    data: unknown
  ): Promise<unknown> {
    this.validateResourceName(resourceName);
    this.validateId(id);

    return this.makeRequest({
      method: "put",
      endpoint: `/${resourceName}/${id}`,
      data,
    });
  }

  /**
   * Delete a record by ID
   *
   * @param resourceName - Name of the resource
   * @param id - Record identifier
   * @returns Promise that resolves when deletion is complete
   * @throws {ApiClientError} When record is not found or API request fails
   *
   * @example
   * ```typescript
   * await client.deleteRecord('users', 'user-123');
   * console.log('User deleted successfully');
   * ```
   */
  public async deleteRecord(resourceName: string, id: string): Promise<void> {
    this.validateResourceName(resourceName);
    this.validateId(id);

    await this.makeRequest({
      method: "delete",
      endpoint: `/${resourceName}/${id}`,
    });
  }

  /**
   * Find a specific record by ID
   *
   * @param resourceName - Name of the resource
   * @param id - Record identifier
   * @returns Promise resolving to the found record
   * @throws {ApiClientError} When record is not found or API request fails
   *
   * @example
   * ```typescript
   * const user = await client.findRecordById('users', 'user-123');
   * console.log('Found user:', user.name);
   * ```
   */
  public async findRecordById(
    resourceName: string,
    id: string
  ): Promise<unknown> {
    this.validateResourceName(resourceName);
    this.validateId(id);

    return this.makeRequest({
      method: "get",
      endpoint: `/${resourceName}/${id}`,
    });
  }

  /**
   * Find records with pagination and optional search
   *
   * @param params - Query parameters including resource name, pagination, and search
   * @returns Promise resolving to paginated response with records and metadata
   * @throws {ApiClientError} When API request fails
   *
   * @example
   * ```typescript
   * const result = await client.findRecords({
   *   resourceName: 'users',
   *   page: 1,
   *   limit: 10,
   *   search: 'john'
   * });
   *
   * console.log(`Found ${result.meta.totalRecords} users`);
   * result.records.forEach(user => console.log(user.name));
   *
   * if (result.meta.hasNext) {
   *   console.log('More results available');
   * }
   * ```
   */
  public async findRecords(
    params: FindRecordsParams
  ): Promise<PaginatedResponse> {
    this.validateResourceName(params.resourceName);

    const searchParams = this.buildSearchParams(params);

    return this.makeRequest({
      method: "get",
      endpoint: `/${params.resourceName}`,
      searchParams,
    });
  }

  // =============================================================================
  // TOKEN MANAGEMENT
  // =============================================================================

  /**
   * Set the access token for authentication
   *
   * This method allows manual token management, useful when implementing
   * custom authentication flows or token persistence.
   *
   * @param token - JWT access token
   * @throws {Error} When token is invalid or empty
   *
   * @example
   * ```typescript
   * // Set token from external source
   * const savedToken = localStorage.getItem('authToken');
   * if (savedToken) {
   *   client.setAccessToken(savedToken);
   * }
   * ```
   */
  public setAccessToken(token: string): void {
    if (!token || typeof token !== "string") {
      throw new Error("Invalid access token: must be a non-empty string");
    }
    this.accessToken = token;
  }

  /**
   * Get the current access token
   *
   * @returns Current access token or null if not authenticated
   *
   * @example
   * ```typescript
   * const token = client.getAccessToken();
   * if (token) {
   *   localStorage.setItem('authToken', token);
   * }
   * ```
   */
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  // =============================================================================
  // PRIVATE VALIDATION METHODS
  // =============================================================================

  private validateConfig(config: ApiConfig): void {
    if (!config.baseUrl) {
      throw new Error("Configuration error: baseUrl is required");
    }
    if (!config.workspaceId) {
      throw new Error("Configuration error: workspaceId is required");
    }
    if (
      config.timeout !== undefined &&
      (config.timeout <= 0 || config.timeout > 300000)
    ) {
      throw new Error(
        "Configuration error: timeout must be between 1 and 300000 milliseconds"
      );
    }
  }

  private validateLoginCredentials(credentials: LoginRequest): void {
    if (!credentials.email) {
      throw new Error("Email is required for login");
    }
    if (!credentials.password) {
      throw new Error("Password is required for login");
    }
    if (
      typeof credentials.email !== "string" ||
      typeof credentials.password !== "string"
    ) {
      throw new Error("Email and password must be strings");
    }
  }

  private validateRegisterData(userData: RegisterRequest): void {
    if (!userData.name) {
      throw new Error("Name is required for registration");
    }
    if (!userData.email) {
      throw new Error("Email is required for registration");
    }
    if (!userData.password) {
      throw new Error("Password is required for registration");
    }
    if (
      typeof userData.name !== "string" ||
      typeof userData.email !== "string" ||
      typeof userData.password !== "string"
    ) {
      throw new Error("Name, email, and password must be strings");
    }
  }

  private validateResourceName(resourceName: string): void {
    if (!resourceName || typeof resourceName !== "string") {
      throw new Error(
        "Resource name is required and must be a non-empty string"
      );
    }
    if (resourceName.trim() !== resourceName) {
      throw new Error(
        "Resource name cannot have leading or trailing whitespace"
      );
    }
  }

  private validateId(id: string): void {
    if (!id || typeof id !== "string") {
      throw new Error("ID is required and must be a non-empty string");
    }
    if (id.trim() !== id) {
      throw new Error("ID cannot have leading or trailing whitespace");
    }
  }

  // =============================================================================
  // PRIVATE HTTP CLIENT METHODS
  // =============================================================================

  private createHttpClient(config: ApiConfig): AxiosInstance {
    return axios.create({
      baseURL: `${config.baseUrl}/api/v1/${config.workspaceId}`,
      timeout: config.timeout ?? 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...config.headers,
      },
    });
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.httpClient.interceptors.request.use(
      (config) => {
        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error: unknown) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.httpClient.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        throw this.handleHttpError(error);
      }
    );
  }

  private handleHttpError(error: AxiosError): Error {
    if (!error.response) {
      return new ApiClientError(
        "Network error: Unable to connect to the server"
      );
    }

    const { status, data } = error.response;
    const apiError = data as ApiError;

    switch (status) {
      case 401:
        return new InvalidCredentialsError(
          apiError?.message ?? "Authentication failed: Invalid credentials"
        );
      case 400:
        return new ValidationError(
          apiError?.message ?? "Validation failed: Invalid request data",
          apiError?.errors ?? []
        );
      case 404:
        return new ApiClientError("Resource not found", 404);
      case 429:
        return new ApiClientError(
          "Rate limit exceeded: Too many requests",
          429
        );
      case 500:
        return new ApiClientError(
          "Internal server error: Please try again later",
          500
        );
      case 503:
        return new ApiClientError(
          "Service unavailable: Server is temporarily down",
          503
        );
      default:
        return new ApiClientError(
          apiError?.message ?? `HTTP error ${status}: Request failed`,
          status
        );
    }
  }

  private buildSearchParams(params: FindRecordsParams): Record<string, string> {
    const searchParams: Record<string, string> = {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
    };

    if (params.search) {
      searchParams.search = params.search;
    }

    return searchParams;
  }

  private async makeRequest(params: RequestParams): Promise<any> {
    try {
      let response: AxiosResponse;

      if (params.method === "get" || params.method === "delete") {
        response = await this.httpClient[params.method](params.endpoint, {
          params: params.searchParams,
        });
      } else {
        response = await this.httpClient[params.method](
          params.endpoint,
          params.data,
          { params: params.searchParams }
        );
      }

      return response.data;
    } catch (error) {
      // Error is already handled by interceptor
      throw error;
    }
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Legacy alias for backward compatibility
 * @deprecated Use ZDataClient instead
 */
export const ExternalApiClient = ZDataClient;
