# zdata-client

A modern, type-safe TypeScript client library for the zdata backend API. Provides authentication, CRUD operations, and comprehensive error handling with excellent developer experience.

## 🚀 Features

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Authentication**: JWT-based login/register with automatic token management
- **CRUD Operations**: Complete Create, Read, Update, Delete operations for any resource
- **Error Handling**: Custom error classes with detailed error information
- **Pagination**: Built-in pagination support with metadata
- **Search**: Integrated search functionality across resources
- **Modern**: ES modules, async/await, and modern JavaScript patterns
- **Zero Dependencies**: Only requires axios for HTTP requests

## 📦 Installation

```bash
npm install zdata-client
```

```bash
yarn add zdata-client
```

```bash
pnpm add zdata-client
```

## 🛠️ Quick Start

### Basic Setup

```typescript
import { ZDataClient } from 'zdata-client';

const client = new ZDataClient({
  baseUrl: 'https://api.yourdomain.com',
  workspaceId: 'your-workspace-id',
  timeout: 10000, // optional, default: 10000ms
  headers: { // optional
    'Custom-Header': 'value'
  }
});
```

### Alternative Setup (Factory Function)

```typescript
import { createClient } from 'zdata-client';

const client = createClient({
  baseUrl: 'https://api.yourdomain.com',
  workspaceId: 'your-workspace-id'
});
```

## 🔐 Authentication

### Login

```typescript
try {
  const auth = await client.login({
    email: 'user@example.com',
    password: 'your-password'
  });
  
  console.log('Welcome,', auth.user.name);
  console.log('Token expires in:', auth.expires_in, 'seconds');
} catch (error) {
  if (error instanceof InvalidCredentialsError) {
    console.error('Invalid email or password');
  }
}
```

### Register

```typescript
try {
  const auth = await client.register({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secure-password'
  });
  
  console.log('Account created for:', auth.user.name);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation errors:', error.errors);
  }
}
```

### Token Management

```typescript
// Manual token management
const token = localStorage.getItem('authToken');
if (token) {
  client.setAccessToken(token);
}

// Save token after login
const auth = await client.login(credentials);
localStorage.setItem('authToken', auth.access_token);

// Check authentication status
if (client.isAuthenticated()) {
  console.log('User is logged in');
}

// Logout
client.logout();
```

## 📋 CRUD Operations

### Create Records

```typescript
const newUser = await client.createRecord('users', {
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: 'admin'
});

console.log('Created user:', newUser);
```

### Read Records

#### Find by ID

```typescript
const user = await client.findRecordById('users', 'user-123');
console.log('User details:', user);
```

#### Find with Pagination and Search

```typescript
const result = await client.findRecords({
  resourceName: 'users',
  page: 1,
  limit: 10,
  search: 'john' // optional search query
});

console.log(`Found ${result.meta.totalRecords} users`);
console.log(`Page ${result.meta.activePageNumber} of ${result.meta.totalPages}`);

result.records.forEach(user => {
  console.log('User:', user.name);
});

// Pagination info
if (result.meta.hasNext) {
  console.log('More results available');
}
```

### Update Records

```typescript
const updatedUser = await client.updateRecord('users', 'user-123', {
  name: 'Jane Doe',
  role: 'superadmin'
});

console.log('Updated user:', updatedUser);
```

### Delete Records

```typescript
await client.deleteRecord('users', 'user-123');
console.log('User deleted successfully');
```

## 🔍 Working with Different Resources

The client works with any resource in your zdata backend:

```typescript
// Products
const products = await client.findRecords({ resourceName: 'products' });
const product = await client.createRecord('products', { name: 'New Product' });

// Orders
const orders = await client.findRecords({ resourceName: 'orders', limit: 20 });
const order = await client.findRecordById('orders', 'order-456');

// Custom resources
const customData = await client.findRecords({ resourceName: 'custom-resource' });
```

## 🚨 Error Handling

The library provides custom error classes for different scenarios:

```typescript
import { 
  InvalidCredentialsError, 
  ValidationError, 
  ApiClientError,
  isValidationError,
  isApiClientError 
} from 'zdata-client';

try {
  await client.createRecord('users', invalidData);
} catch (error) {
  if (isValidationError(error)) {
    console.error('Validation failed:');
    error.errors.forEach(err => {
      console.error(`- ${err.message} at ${err.path.join('.')}`);
    });
  } else if (isApiClientError(error)) {
    console.error(`API Error (${error.statusCode}):`, error.message);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### Error Types

- **`InvalidCredentialsError`**: Authentication failed (401)
- **`ValidationError`**: Request data validation failed (400)
- **`ApiClientError`**: General API errors (404, 500, etc.)

## 🔧 Advanced Usage

### Custom Headers

```typescript
const client = new ZDataClient({
  baseUrl: 'https://api.yourdomain.com',
  workspaceId: 'workspace-id',
  headers: {
    'X-Custom-Header': 'custom-value',
    'X-Client-Version': '1.0.0'
  }
});
```

### Request Timeout

```typescript
const client = new ZDataClient({
  baseUrl: 'https://api.yourdomain.com',
  workspaceId: 'workspace-id',
  timeout: 30000 // 30 seconds
});
```

### Pagination Helper

```typescript
async function getAllUsers() {
  const allUsers = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const result = await client.findRecords({
      resourceName: 'users',
      page,
      limit: 100
    });
    
    allUsers.push(...result.records);
    hasMore = result.meta.hasNext;
    page++;
  }
  
  return allUsers;
}
```

## 📚 API Reference

### Client Configuration

```typescript
interface ApiConfig {
  baseUrl: string;           // API base URL
  workspaceId: string;       // Workspace identifier
  timeout?: number;          // Request timeout (default: 10000ms)
  headers?: Record<string, string>; // Custom headers
}
```

### Authentication Methods

- `login(credentials: LoginRequest): Promise<AuthResponse>`
- `register(userData: RegisterRequest): Promise<AuthResponse>`
- `logout(): void`
- `isAuthenticated(): boolean`
- `setAccessToken(token: string): void`
- `getAccessToken(): string | null`

### CRUD Methods

- `createRecord(resourceName: string, data: unknown): Promise<unknown>`
- `updateRecord(resourceName: string, id: string, data: unknown): Promise<unknown>`
- `deleteRecord(resourceName: string, id: string): Promise<void>`
- `findRecordById(resourceName: string, id: string): Promise<unknown>`
- `findRecords(params: FindRecordsParams): Promise<PaginatedResponse>`

### Response Types

```typescript
interface PaginatedResponse<T = unknown> {
  records: T[];
  meta: {
    activePageNumber: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## 🌟 Best Practices

### 1. Environment Configuration

```typescript
// config.ts
export const apiConfig = {
  baseUrl: process.env.VITE_API_BASE_URL || 'https://api.yourdomain.com',
  workspaceId: process.env.VITE_WORKSPACE_ID || 'default-workspace'
};

// app.ts
import { ZDataClient } from 'zdata-client';
import { apiConfig } from './config';

const client = new ZDataClient(apiConfig);
```

### 2. Error Boundary

```typescript
class ApiService {
  private client: ZDataClient;
  
  constructor(config: ApiConfig) {
    this.client = new ZDataClient(config);
  }
  
  async getUsers(page = 1, search?: string) {
    try {
      return await this.client.findRecords({
        resourceName: 'users',
        page,
        limit: 10,
        search
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }
}
```

### 3. Token Persistence

```typescript
class AuthManager {
  private client: ZDataClient;
  
  constructor(client: ZDataClient) {
    this.client = client;
    this.loadStoredToken();
  }
  
  private loadStoredToken() {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.client.setAccessToken(token);
    }
  }
  
  async login(credentials: LoginRequest) {
    const auth = await this.client.login(credentials);
    localStorage.setItem('authToken', auth.access_token);
    return auth;
  }
  
  logout() {
    this.client.logout();
    localStorage.removeItem('authToken');
  }
}
```

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For questions and support, please open an issue in the GitHub repository.
