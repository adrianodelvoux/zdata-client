import { AxiosHttpClient } from '../core/http/axios-http-client';
import { AuthService } from '../core/auth/auth-service';
import { ResourceRepository } from '../repositories/resource-repository';
import { MemoryCache } from '../features/cache/memory-cache';
import type { CacheConfig } from '../features/cache/cache.interface';
import { RetryPolicy } from '../features/retry/retry-policy';
import { Validator } from '../features/validation/validator';
import { ApiConfigSchema } from '../features/validation/schemas';
import type {
  ApiConfig,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  FindRecordsParams,
} from '../features/validation/schemas';
import type { PaginatedResponse } from '../repositories/resource-repository';
import type { HttpClient } from '../core/http/http-client.interface';
import type { Cache } from '../features/cache/cache.interface';

export interface ZDataClientConfig extends ApiConfig {
  readonly enableCache?: boolean;
  readonly enableRetry?: boolean;
  readonly cacheConfig?: {
    readonly defaultTtlMs: number;
    readonly maxSize?: number;
  };
}

export class ZDataClient {
  private static readonly DEFAULT_CACHE_TTL_MS = 300_000; // 5 minutes in milliseconds

  private readonly httpClient: HttpClient;
  private readonly authService: AuthService;
  private readonly resourceRepository: ResourceRepository;
  private readonly cache?: Cache;
  private readonly retryPolicy?: RetryPolicy;

  public constructor(config: ZDataClientConfig) {
    const validatedConfig = Validator.validate(ApiConfigSchema, config);

    // Setup cache if enabled
    if (config.enableCache) {
      const cacheConfig: CacheConfig = {
        defaultTtlMs:
          config.cacheConfig?.defaultTtlMs ?? ZDataClient.DEFAULT_CACHE_TTL_MS,
        ...(config.cacheConfig?.maxSize !== undefined && {
          maxSize: config.cacheConfig.maxSize,
        }),
      };
      this.cache = new MemoryCache(cacheConfig);
    }

    // Setup retry policy if enabled
    if (config.enableRetry) {
      this.retryPolicy = new RetryPolicy();
    }

    // Create HTTP client with base URL
    const baseURL = `${validatedConfig.baseUrl}/api/v1/${validatedConfig.workspaceId}`;
    this.httpClient = new AxiosHttpClient(baseURL, validatedConfig.timeout);

    // Setup services
    this.authService = new AuthService(this.httpClient);
    this.resourceRepository = new ResourceRepository(
      this.httpClient,
      this.authService,
      this.cache,
    );
  }

  // Authentication methods
  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.executeWithRetry(() => this.authService.login(credentials));
  }

  public async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.executeWithRetry(() => this.authService.register(userData));
  }

  public logout(): void {
    this.authService.logout();
    this.cache?.clear();
  }

  public isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  public setAccessToken(token: string): void {
    this.authService.setAccessToken(token);
  }

  public getAccessToken(): string | null {
    return this.authService.getAccessToken();
  }

  // CRUD methods
  public async createRecord<T>(
    resourceName: string,
    data: unknown,
  ): Promise<T & { id: string; created_at: string; updated_at: string }> {
    return this.executeWithRetry(() =>
      this.resourceRepository.createRecord<T>(resourceName, data),
    );
  }

  public async updateRecord<T>(
    resourceName: string,
    id: string,
    data: unknown,
  ): Promise<T & { id: string; created_at: string; updated_at: string }> {
    return this.executeWithRetry(() =>
      this.resourceRepository.updateRecord<T>(resourceName, id, data),
    );
  }

  public async deleteRecord(resourceName: string, id: string): Promise<void> {
    return this.executeWithRetry(() =>
      this.resourceRepository.deleteRecord(resourceName, id),
    );
  }

  public async findRecordById<T>(
    resourceName: string,
    id: string,
  ): Promise<T & { id: string; created_at: string; updated_at: string }> {
    return this.executeWithRetry(() =>
      this.resourceRepository.findRecordById<T>(resourceName, id),
    );
  }

  public async findRecords<T>(
    params: FindRecordsParams,
  ): Promise<
    PaginatedResponse<
      T & { id: string; created_at: string; updated_at: string }
    >
  > {
    return this.executeWithRetry(() =>
      this.resourceRepository.findRecords<T>(params),
    );
  }

  // Cache management
  public clearCache(): void {
    this.cache?.clear();
  }

  public getCacheStats(): { size: number } | null {
    if (this.cache && 'size' in this.cache) {
      return { size: (this.cache as MemoryCache).size() };
    }
    return null;
  }

  // Private helper methods
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    if (this.retryPolicy) {
      return this.retryPolicy.execute(operation);
    }
    return operation();
  }
}
