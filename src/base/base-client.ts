/**
 * @fileoverview Base client for creating custom data sources using the refactored architecture
 */

import { ZDataClient } from '../services/zdata-client';
import type { ZDataClientConfig } from '../services/zdata-client';
import type {
  FindRecordsParams,
  BaseEntity,
} from '../features/validation/schemas';
import type { PaginatedResponse } from '../repositories/resource-repository';

/**
 * Utility type to create entity input without base fields
 */
export type CreateEntity<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

/**
 * Utility type to represent entity with base fields
 */
export type EntityWithBase<T> = T & BaseEntity;

/**
 * Abstract base class for creating custom data source clients
 *
 * This class extends ZDataClient and provides a foundation for creating
 * type-safe data access layers for specific entities. It allows developers
 * to create strongly-typed wrappers around the generic CRUD operations.
 *
 * @template T - The entity type this client manages
 *
 * @example
 * ```typescript
 * interface Payment {
 *   amount: number;
 *   description: string;
 *   userId: string;
 * }
 *
 * class PaymentClient extends BaseDataSourceClient<Payment> {
 *   constructor(config: ZDataClientConfig) {
 *     super(config, 'pagamentos');
 *   }
 *
 *   // Optional: Add custom business logic methods
 *   async findPaymentsByUser(userId: string) {
 *     return this.find({
 *       search: `user:${userId}`,
 *     });
 *   }
 * }
 * ```
 */
export abstract class BaseDataSourceClient<T> extends ZDataClient {
  protected readonly resourceName: string;

  /**
   * Create a new data source client instance
   *
   * @param config - Client configuration
   * @param resourceName - The name of the resource/endpoint (e.g., 'users', 'payments')
   */
  public constructor(config: ZDataClientConfig, resourceName: string) {
    super(config);
    this.resourceName = resourceName;
  }

  /**
   * Create a new record of type T
   *
   * @param data - Record data without base fields
   * @returns Promise resolving to created record with base fields
   */
  public async create(data: CreateEntity<T>): Promise<EntityWithBase<T>> {
    return this.createRecord(this.resourceName, data) as Promise<
      EntityWithBase<T>
    >;
  }

  /**
   * Find a record by its ID
   *
   * @param id - Record ID
   * @returns Promise resolving to the record or null if not found
   */
  public async findById(id: string): Promise<EntityWithBase<T> | null> {
    try {
      return (await this.findRecordById(
        this.resourceName,
        id,
      )) as EntityWithBase<T>;
    } catch {
      return null;
    }
  }

  /**
   * Find records with pagination and search
   *
   * @param params - Search and pagination parameters
   * @returns Promise resolving to paginated results
   */
  public async find(
    params: Omit<FindRecordsParams, 'resourceName'> = {},
  ): Promise<PaginatedResponse<EntityWithBase<T>>> {
    return this.findRecords({
      resourceName: this.resourceName,
      ...params,
    }) as Promise<PaginatedResponse<EntityWithBase<T>>>;
  }

  /**
   * Update a record by its ID
   *
   * @param id - Record ID
   * @param data - Partial data to update
   * @returns Promise resolving to updated record
   */
  public async update(
    id: string,
    data: Partial<CreateEntity<T>>,
  ): Promise<EntityWithBase<T>> {
    return this.updateRecord(this.resourceName, id, data) as Promise<
      EntityWithBase<T>
    >;
  }

  /**
   * Delete a record by its ID
   *
   * @param id - Record ID
   * @returns Promise resolving when record is deleted
   */
  public async delete(id: string): Promise<void> {
    return this.deleteRecord(this.resourceName, id);
  }
}

/**
 * Concrete implementation of BaseDataSourceClient for easy instantiation
 *
 * This class provides a ready-to-use implementation without requiring
 * inheritance. Useful for simple cases where you don't need custom methods.
 *
 * @template T - The entity type this client manages
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   email: string;
 * }
 *
 * const userClient = new DataSourceClient<User>(config, 'users');
 * const users = await userClient.find({ page: 1, limit: 10 });
 * ```
 */
export class DataSourceClient<T> extends BaseDataSourceClient<T> {
  /**
   * Create a new data source client instance
   *
   * @param config - Client configuration
   * @param resourceName - The name of the resource/endpoint
   */
  public constructor(config: ZDataClientConfig, resourceName: string) {
    super(config, resourceName);
  }
}
