import type { HttpClient } from '../core/http/http-client.interface';
import type { AuthService } from '../core/auth/auth-service';
import type { FindRecordsParams } from '../features/validation/schemas';
import { Validator } from '../features/validation/validator';
import {
  FindRecordsParamsSchema,
  PaginatedResponseSchema,
} from '../features/validation/schemas';
import { ApiClientError } from '../core/errors/api-errors';
import { HttpError } from '../core/errors/http-error';
import type { Cache } from '../features/cache/cache.interface';
import { z } from 'zod';

export interface PaginatedResponse<T> {
  readonly records: readonly T[];
  readonly meta: {
    readonly activePageNumber: number;
    readonly limit: number;
    readonly totalRecords: number;
    readonly totalPages: number;
    readonly hasNext: boolean;
    readonly hasPrev: boolean;
  };
}

export class ResourceRepository {
  private static readonly CACHE_TTL_MS = 300_000; // 5 minutes in milliseconds
  private static readonly DEFAULT_PAGE_SIZE = 10;

  public constructor(
    private readonly httpClient: HttpClient,
    private readonly authService: AuthService,
    private readonly cache?: Cache,
  ) {}

  public async createRecord<T>(
    resourceName: string,
    data: unknown,
  ): Promise<T & { id: string; created_at: string; updated_at: string }> {
    this.validateResourceName(resourceName);

    try {
      const response = await this.httpClient.request({
        method: 'POST',
        url: `/${resourceName}`,
        data,
        headers: this.authService.getAuthHeader(),
      });

      this.invalidateCacheForResource(resourceName);
      return response.data as T & {
        id: string;
        created_at: string;
        updated_at: string;
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async updateRecord<T>(
    resourceName: string,
    id: string,
    data: unknown,
  ): Promise<T & { id: string; created_at: string; updated_at: string }> {
    this.validateResourceName(resourceName);
    this.validateId(id);

    try {
      const response = await this.httpClient.request({
        method: 'PUT',
        url: `/${resourceName}/${id}`,
        data,
        headers: this.authService.getAuthHeader(),
      });

      this.invalidateCacheForResource(resourceName);
      this.invalidateCacheForRecord(resourceName, id);

      return response.data as T & {
        id: string;
        created_at: string;
        updated_at: string;
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async deleteRecord(resourceName: string, id: string): Promise<void> {
    this.validateResourceName(resourceName);
    this.validateId(id);

    try {
      await this.httpClient.request({
        method: 'DELETE',
        url: `/${resourceName}/${id}`,
        headers: this.authService.getAuthHeader(),
      });

      this.invalidateCacheForResource(resourceName);
      this.invalidateCacheForRecord(resourceName, id);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async findRecordById<T>(
    resourceName: string,
    id: string,
  ): Promise<T & { id: string; created_at: string; updated_at: string }> {
    this.validateResourceName(resourceName);
    this.validateId(id);

    const cacheKey = this.getCacheKey(resourceName, id);

    if (this.cache?.has(cacheKey)) {
      const cached = this.cache.get<
        T & { id: string; created_at: string; updated_at: string }
      >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.httpClient.request({
        method: 'GET',
        url: `/${resourceName}/${id}`,
        headers: this.authService.getAuthHeader(),
      });

      const result = response.data as T & {
        id: string;
        created_at: string;
        updated_at: string;
      };

      if (this.cache) {
        this.cache.set(cacheKey, result, ResourceRepository.CACHE_TTL_MS);
      }

      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async findRecords<T>(
    params: FindRecordsParams,
  ): Promise<
    PaginatedResponse<
      T & { id: string; created_at: string; updated_at: string }
    >
  > {
    const validatedParams = Validator.validate(FindRecordsParamsSchema, params);

    const cacheKey = this.getCacheKey(
      validatedParams.resourceName,
      'list',
      JSON.stringify(validatedParams),
    );

    if (this.cache?.has(cacheKey)) {
      const cached =
        this.cache.get<
          PaginatedResponse<
            T & { id: string; created_at: string; updated_at: string }
          >
        >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const searchParams = this.buildSearchParams(validatedParams);

      const response = await this.httpClient.request({
        method: 'GET',
        url: `/${validatedParams.resourceName}`,
        params: searchParams,
        headers: this.authService.getAuthHeader(),
      });

      // Validate response structure
      const schema = PaginatedResponseSchema(z.unknown());
      const validatedResponse = Validator.validate(schema, response.data);

      const result = validatedResponse as PaginatedResponse<
        T & { id: string; created_at: string; updated_at: string }
      >;

      if (this.cache) {
        this.cache.set(cacheKey, result, ResourceRepository.CACHE_TTL_MS);
      }

      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private validateResourceName(resourceName: string): void {
    if (!resourceName || typeof resourceName !== 'string') {
      throw new Error(
        'Resource name is required and must be a non-empty string',
      );
    }
    if (resourceName.trim() !== resourceName) {
      throw new Error(
        'Resource name cannot have leading or trailing whitespace',
      );
    }
  }

  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a non-empty string');
    }
    if (id.trim() !== id) {
      throw new Error('ID cannot have leading or trailing whitespace');
    }
  }

  private buildSearchParams(params: FindRecordsParams): Record<string, string> {
    const searchParams: Record<string, string> = {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? ResourceRepository.DEFAULT_PAGE_SIZE),
    };

    if (params.search) {
      searchParams.search = params.search;
    }

    return searchParams;
  }

  private handleError(error: unknown): Error {
    if (error instanceof HttpError) {
      return new ApiClientError(error.message, error.statusCode);
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unknown error occurred');
  }

  private getCacheKey(...parts: string[]): string {
    return parts.join(':');
  }

  private invalidateCacheForResource(_resourceName: string): void {
    if (!this.cache) {
      return;
    }

    // In a real implementation, you might want to track cache keys
    // For now, we just clear all cache to be safe
    this.cache.clear();
  }

  private invalidateCacheForRecord(resourceName: string, id: string): void {
    if (!this.cache) {
      return;
    }

    const cacheKey = this.getCacheKey(resourceName, id);
    this.cache.delete(cacheKey);
  }
}
