# zdata-client - AI Integration Guide

This document provides AI assistants with the essential information needed to generate code using the zdata-client library.

## Library Overview

`zdata-client` is a modern TypeScript client library for zdata backend API providing authentication, CRUD operations, caching, retry logic, and comprehensive validation with full type safety.

## Installation

```bash
npm install zdata-client
```

## Core API Contracts

### Client Initialization

```typescript
import { ZDataClient, createClient } from 'zdata-client';

// Constructor approach
const client = new ZDataClient({
  baseUrl: string,
  workspaceId: string,
  timeout?: number,        // optional, default: 10000ms
  headers?: Record<string, string>,  // optional
  enableCache?: boolean,   // optional, enables smart caching
  enableRetry?: boolean,   // optional, enables auto-retry
  cacheConfig?: {          // optional cache configuration
    defaultTtlMs: number,  // cache TTL in milliseconds
    maxSize?: number       // max cache entries
  }
});

// Factory function approach
const client = createClient({ baseUrl, workspaceId });

// Advanced setup with caching and retry
const client = new ZDataClient({
  baseUrl: 'https://api.example.com',
  workspaceId: 'workspace-123',
  enableCache: true,
  enableRetry: true,
  cacheConfig: {
    defaultTtlMs: 300000,  // 5 minutes
    maxSize: 1000
  }
});
```

### Authentication Methods

```typescript
// Login
await client.login({
  email: string,
  password: string
}): Promise<AuthResponse>

// Register
await client.register({
  name: string,
  email: string,
  password: string
}): Promise<AuthResponse>

// Token management
client.setAccessToken(token: string): void
client.getAccessToken(): string | null
client.isAuthenticated(): boolean
client.logout(): void

// Cache management (when enableCache: true)
client.clearCache(): void
client.getCacheStats(): { size: number } | null
```

### CRUD Operations

```typescript
// Create
await client.createRecord(resourceName: string, data: unknown): Promise<unknown>

// Read by ID
await client.findRecordById(resourceName: string, id: string): Promise<unknown>

// Read with pagination/search
await client.findRecords({
  resourceName: string,
  page?: number,          // default: 1
  limit?: number,         // default: 10
  search?: string         // optional search query
}): Promise<PaginatedResponse>

// Update
await client.updateRecord(resourceName: string, id: string, data: unknown): Promise<unknown>

// Delete
await client.deleteRecord(resourceName: string, id: string): Promise<void>
```

## Response Types

### AuthResponse
```typescript
{
  access_token: string,
  expires_in: number,
  token_type: string,
  user: {
    id: string,
    email: string,
    name: string
  }
}
```

### PaginatedResponse
```typescript
{
  records: T[],
  meta: {
    activePageNumber: number,
    limit: number,
    totalRecords: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}
```

## Error Handling

### Error Types
```typescript
import { 
  InvalidCredentialsError,  // 401 errors
  ValidationError,          // 400 errors with .errors array
  ApiClientError,          // General API errors with .statusCode
  isValidationError,       // Type guard
  isApiClientError,        // Type guard
  isInvalidCredentialsError, // Type guard
  Validator,               // Runtime validation utility
  // Validation schemas
  ApiConfigSchema,
  LoginRequestSchema,
  RegisterRequestSchema
} from 'zdata-client';
```

### Error Handling Pattern
```typescript
try {
  await client.someMethod();
} catch (error) {
  if (isValidationError(error)) {
    // Handle validation errors: error.errors[]
  } else if (isApiClientError(error)) {
    // Handle API errors: error.statusCode, error.message
  }
}
```

## Common Code Patterns

### Basic Setup
```typescript
import { ZDataClient } from 'zdata-client';

const client = new ZDataClient({
  baseUrl: 'https://api.example.com',
  workspaceId: 'workspace-123'
});
```

### Authentication Flow
```typescript
// Login and save token
const auth = await client.login({ email, password });
localStorage.setItem('token', auth.access_token);

// Restore session
const savedToken = localStorage.getItem('token');
if (savedToken) {
  client.setAccessToken(savedToken);
}
```

### CRUD Examples
```typescript
// Create user
const user = await client.createRecord('users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Get paginated users with search
const result = await client.findRecords({
  resourceName: 'users',
  page: 1,
  limit: 20,
  search: 'john'
});

// Update user
const updated = await client.updateRecord('users', 'user-123', {
  name: 'John Smith'
});

// Delete user
await client.deleteRecord('users', 'user-123');
```

### Pagination Pattern
```typescript
let page = 1;
let allRecords = [];

do {
  const result = await client.findRecords({
    resourceName: 'users',
    page,
    limit: 100
  });
  
  allRecords.push(...result.records);
  page++;
} while (result.meta.hasNext);
```

### Advanced Features

```typescript
// Runtime validation
import { Validator, ApiConfigSchema } from 'zdata-client';

const config = { baseUrl: 'https://api.example.com', workspaceId: 'ws-123' };
const validConfig = Validator.validate(ApiConfigSchema, config);

// Cache management
const client = new ZDataClient({
  baseUrl: 'https://api.example.com', 
  workspaceId: 'workspace-123',
  enableCache: true,
  cacheConfig: { defaultTtlMs: 300000 }
});

// Cache operations
client.clearCache();
const stats = client.getCacheStats();
console.log(`Cache has ${stats?.size} entries`);

// Type-safe operations with generics
interface User {
  name: string;
  email: string;
}

const user = await client.createRecord<User>('users', {
  name: 'John Doe',
  email: 'john@example.com'
});
// user has type: User & { id: string; created_at: string; updated_at: string }

// Custom base client for specific resources
import { BaseDataSourceClient } from 'zdata-client';

class UserClient extends BaseDataSourceClient<User> {
  constructor(config) {
    super(config, 'users');
  }
  
  async findByEmail(email: string) {
    return this.find({ search: `email:${email}` });
  }
}
```

## Resource Names

The `resourceName` parameter accepts any string representing a backend resource (e.g., 'users', 'products', 'orders', 'custom-resource').

## Key Points for AI Code Generation

1. **Type Safety**: All methods return typed promises, use generics `<T>` for type-safe operations
2. **Error Handling**: Always wrap API calls in try-catch blocks with proper type guards
3. **Authentication**: Check `client.isAuthenticated()` before protected operations
4. **Pagination**: Use `meta.hasNext` and `meta.hasPrev` for pagination logic
5. **Resource Flexibility**: Any resource name string is valid
6. **Token Management**: Implement token persistence for better UX
7. **Validation**: ValidationError includes detailed error information in `.errors` array
8. **Caching**: Enable with `enableCache: true` for better performance, manage with `clearCache()`
9. **Retry Logic**: Enable with `enableRetry: true` for automatic retry on failed requests
10. **Runtime Validation**: Use `Validator.validate()` for schema validation
11. **Custom Clients**: Extend `BaseDataSourceClient<T>` for type-safe resource-specific clients
12. **Configuration**: Use `ZDataClientConfig` type for advanced setup with cache/retry options

## Import Statement
Always import from the main package:
```typescript
import { ZDataClient, /* other exports */ } from 'zdata-client';
```