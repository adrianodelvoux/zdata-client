# zdata-client - AI Integration Guide

This document provides AI assistants with the essential information needed to generate code using the zdata-client library.

## Library Overview

`zdata-client` is a TypeScript client library for zdata backend API providing authentication and CRUD operations with full type safety.

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
  headers?: Record<string, string>  // optional
});

// Factory function approach
const client = createClient({ baseUrl, workspaceId });
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
  isApiClientError        // Type guard
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

## Resource Names

The `resourceName` parameter accepts any string representing a backend resource (e.g., 'users', 'products', 'orders', 'custom-resource').

## Key Points for AI Code Generation

1. **Type Safety**: All methods return typed promises, use `unknown` for flexible data types
2. **Error Handling**: Always wrap API calls in try-catch blocks
3. **Authentication**: Check `client.isAuthenticated()` before protected operations
4. **Pagination**: Use `meta.hasNext` and `meta.hasPrev` for pagination logic
5. **Resource Flexibility**: Any resource name string is valid
6. **Token Management**: Implement token persistence for better UX
7. **Validation**: ValidationError includes detailed error information in `.errors` array

## Import Statement
Always import from the main package:
```typescript
import { ZDataClient, /* other exports */ } from 'zdata-client';
```