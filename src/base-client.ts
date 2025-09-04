/**
 * @fileoverview Base client for creating custom data sources
 */

import { ZDataClient } from "./client.js";
import type {
  ApiConfig,
  CreateEntity,
  EntityWithBase,
  FindRecordsParams,
  PaginatedResponse,
} from "./types.js";

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
 *   constructor(config: ApiConfig) {
 *     super(config, 'pagamentos');
 *   }
 *
 *   // Optional: Add custom business logic methods
 *   async findPaymentsByUser(userId: string) {
 *     return this.findRecords({
 *       resourceName: this.resourceName,
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
   * @param config - API client configuration
   * @param resourceName - Name of the resource this client manages
   */
  constructor(config: ApiConfig, resourceName: string) {
    super(config);
    this.resourceName = resourceName;
  }

  /**
   * Create a new record for this resource
   * @param data - Entity data to create (without base fields)
   * @returns Promise resolving to the created entity with base fields
   */
  public async create(data: CreateEntity<T>): Promise<EntityWithBase<T>> {
    return this.createRecord<T>(this.resourceName, data);
  }

  /**
   * Update an existing record
   * @param id - Record identifier
   * @param data - Partial entity data to update
   * @returns Promise resolving to the updated entity with base fields
   */
  public async update(
    id: string,
    data: Partial<CreateEntity<T>>
  ): Promise<EntityWithBase<T>> {
    return this.updateRecord<T>(this.resourceName, id, data);
  }

  /**
   * Delete a record by ID
   * @param id - Record identifier
   * @returns Promise that resolves when deletion is complete
   */
  public async delete(id: string): Promise<void> {
    return this.deleteRecord(this.resourceName, id);
  }

  /**
   * Find a specific record by ID
   * @param id - Record identifier
   * @returns Promise resolving to the found entity with base fields
   */
  public async findById(id: string): Promise<EntityWithBase<T>> {
    return this.findRecordById<T>(this.resourceName, id);
  }

  /**
   * Find records with pagination and optional search
   * @param params - Query parameters (resourceName will be automatically set)
   * @returns Promise resolving to paginated response with entities
   */
  public async find(
    params: Omit<FindRecordsParams, "resourceName"> = {}
  ): Promise<PaginatedResponse<EntityWithBase<T>>> {
    return this.findRecords<T>({
      resourceName: this.resourceName,
      ...params,
    });
  }

  /**
   * Get the resource name this client manages
   * @returns The resource name
   */
  public getResourceName(): string {
    return this.resourceName;
  }
}

/**
 * Concrete implementation of BaseDataSourceClient for easy instantiation
 *
 * This class can be used when you don't need custom business logic
 * but want the benefits of type safety and simplified method names.
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
 *
 * const newUser = await userClient.create({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 *
 * const users = await userClient.find({ page: 1, limit: 10 });
 * ```
 */
export class DataSourceClient<T> extends BaseDataSourceClient<T> {
  constructor(config: ApiConfig, resourceName: string) {
    super(config, resourceName);
  }
}
