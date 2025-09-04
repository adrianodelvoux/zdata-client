# ZData Client

**ZData Client** is a TypeScript library that provides a complete interface for interacting with the ZData API, including authentication, CRUD operations, and token management with robust error handling.

## 🚀 Installation

```bash
npm install zdata-client
```

## 📖 Overview

This library offers:

- ✅ **Complete authentication** (login, registration, token management)
- ✅ **Type-safe CRUD operations** for any resource
- ✅ **Intelligent error handling** with specific types
- ✅ **Automatic pagination** with complete metadata
- ✅ **Native TypeScript** with robust types
- ✅ **Customizable client** for your specific entities

## 🔧 Initial Setup

```typescript
import { ZDataClient, ApiConfig } from "zdata-client";

const config: ApiConfig = {
  baseUrl: "https://api.example.com",
  workspaceId: "workspace-123",
  timeout: 15000, // 15 seconds (optional)
  headers: {
    // custom headers (optional)
    "X-App-Version": "1.0.0",
  },
};

const client = new ZDataClient(config);
```

## 🔐 Authentication

### Login

```typescript
import {
  LoginRequest,
  AuthResponse,
  InvalidCredentialsError,
  ValidationError,
} from "zdata-client";

async function performLogin() {
  try {
    const credentials: LoginRequest = {
      email: "user@example.com",
      password: "securePassword123",
    };

    const auth: AuthResponse = await client.login(credentials);

    // Response contains:
    // {
    //   access_token: "eyJhbGciOiJIUzI1NiIs...",
    //   expires_in: 3600,
    //   token_type: "Bearer",
    //   user: {
    //     id: "user-123",
    //     email: "user@example.com",
    //     name: "John Silva"
    //   }
    // }

    console.log(`Logged in as: ${auth.user.name}`);

    // Save token to localStorage
    localStorage.setItem("authToken", auth.access_token);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      console.error("❌ Invalid email or password");
    } else if (error instanceof ValidationError) {
      console.error("❌ Invalid login data:", error.errors);
    } else {
      console.error("❌ Unexpected error:", error.message);
    }
  }
}
```

### Registration

```typescript
import { RegisterRequest } from "zdata-client";

async function createAccount() {
  try {
    const userData: RegisterRequest = {
      name: "Maria Santos",
      email: "maria@example.com",
      password: "strongPassword456",
    };

    const auth: AuthResponse = await client.register(userData);
    console.log(`✅ Account created for: ${auth.user.name}`);

    // Token is already available after registration
    localStorage.setItem("authToken", auth.access_token);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("❌ Validation errors:");
      error.errors.forEach((err) => {
        console.error(`  • ${err.message} (field: ${err.path.join(".")})`);
      });

      // Example validation error:
      // [
      //   {
      //     code: "INVALID_EMAIL",
      //     path: ["email"],
      //     message: "Invalid email format"
      //   },
      //   {
      //     code: "PASSWORD_TOO_SHORT",
      //     path: ["password"],
      //     message: "Password must be at least 8 characters"
      //   }
      // ]
    }
  }
}
```

### Session Management

```typescript
// Restore saved session
function restoreSession() {
  const savedToken = localStorage.getItem("authToken");
  if (savedToken) {
    client.setAccessToken(savedToken);

    if (client.isAuthenticated()) {
      console.log("✅ User already authenticated");
    }
  }
}

// Logout
function logout() {
  client.logout();
  localStorage.removeItem("authToken");
  console.log("✅ Logout completed");
}

// Check authentication status
function checkAuth() {
  if (client.isAuthenticated()) {
    console.log("🔒 User authenticated");
    const token = client.getAccessToken();
    console.log("Current token:", token?.substring(0, 20) + "...");
  } else {
    console.log("🔓 User not authenticated");
  }
}
```

## 🛠️ Robust Error Handling

```typescript
import {
  ApiClientError,
  ValidationError,
  InvalidCredentialsError,
  isValidationError,
  isApiClientError,
} from "zdata-client";

async function errorHandlingExample() {
  try {
    // Attempt an operation that might fail
    await client.createRecord("products", {
      name: "", // required field empty
      price: -10, // invalid value
    });
  } catch (error) {
    // Specific handling by error type
    if (isValidationError(error)) {
      console.error("🔍 Validation errors found:");
      error.errors.forEach((err, index) => {
        console.error(`  ${index + 1}. ${err.message}`);
        console.error(`     Field: ${err.path.join(".")}`);
        console.error(`     Code: ${err.code}`);
      });

      // Example validation error response:
      // {
      //   message: "Validation failed",
      //   errors: [
      //     {
      //       code: "REQUIRED_FIELD",
      //       path: ["name"],
      //       message: "Name field is required"
      //     },
      //     {
      //       code: "INVALID_VALUE",
      //       path: ["price"],
      //       message: "Price must be greater than zero"
      //     }
      //   ]
      // }
    } else if (isApiClientError(error)) {
      // API errors (404, 500, etc.)
      console.error(`🌐 API Error (${error.statusCode}): ${error.message}`);

      switch (error.statusCode) {
        case 404:
          console.error("Resource not found");
          break;
        case 429:
          console.error("Too many requests - try again in a few minutes");
          break;
        case 500:
          console.error("Internal server error");
          break;
      }
    } else if (error instanceof InvalidCredentialsError) {
      console.error("🔑 Invalid credentials - please login again");
    } else {
      console.error("❌ Unexpected error:", error.message);
    }
  }
}
```

## 📋 Advanced CRUD Operations

### Search with Pagination and Filters

```typescript
import { FindRecordsParams, PaginatedResponse } from "zdata-client";

async function searchProductsPaginated() {
  try {
    const params: FindRecordsParams = {
      resourceName: "products",
      search: "laptop", // text search
      page: 1,
      limit: 20,
    };

    const result: PaginatedResponse<Products> = await client.findRecords(
      params
    );

    // Pagination metadata
    console.log(`📊 Results: ${result.meta.totalRecords} products found`);
    console.log(
      `📄 Page ${result.meta.activePageNumber} of ${result.meta.totalPages}`
    );
    console.log(`🔍 Showing ${result.records.length} products`);

    // Product data
    result.records.forEach((product) => {
      console.log(`• ${product.name} - $${product.selling_price}`);
      console.log(`  Code: ${product.code} | Stock: ${product.current_stock}`);
    });

    // Navigation
    if (result.meta.hasNext) {
      console.log("➡️ More pages available");
    }

    if (result.meta.hasPrev) {
      console.log("⬅️ Previous pages available");
    }
  } catch (error) {
    console.error("Error searching products:", error);
  }
}
```

### Creation with Validation

```typescript
async function createCompleteProduct() {
  try {
    const newProduct: Products = {
      // Required fields
      id: "", // will be generated automatically
      name: "Gaming Laptop XYZ",
      code: "NB-XYZ-001",
      selling_price: 2500.0,
      cost_price: 1800.0,
      current_stock: 10,
      active: true,
      created_at: new Date(), // will be set by server
      updated_at: new Date(), // will be set by server
    };

    const createdProduct = await client.createRecord<Products>(
      "products",
      newProduct
    );

    console.log("✅ Product created successfully:");
    console.log(`ID: ${createdProduct.id}`);
    console.log(`Name: ${createdProduct.name}`);
    console.log(`Created at: ${createdProduct.created_at}`);
  } catch (error) {
    if (isValidationError(error)) {
      console.error("❌ Invalid product data:");
      error.errors.forEach((err) => {
        console.error(`• ${err.message}`);
      });
    }
  }
}
```

### Partial Update

```typescript
async function updateProductPrice(productId: string) {
  try {
    // Partial update - only changed fields
    const updateData = {
      selling_price: 2300.0,
      cost_price: 1650.0,
    };

    const updatedProduct = await client.updateRecord<Products>(
      "products",
      productId,
      updateData
    );

    console.log("✅ Prices updated:");
    console.log(`Selling: $${updatedProduct.selling_price}`);
    console.log(`Cost: $${updatedProduct.cost_price}`);
    console.log(`Updated at: ${updatedProduct.updated_at}`);
  } catch (error) {
    if (isApiClientError(error) && error.statusCode === 404) {
      console.error("❌ Product not found");
    }
  }
}
```

## 🎯 Custom Client

```typescript
import { ApiConfig, FindRecordsParams, ZDataClient } from "zdata-client";

/**
 * Entity Interfaces
 */

export type Products = {
  id: string;
  name: string;
  code: string;
  selling_price: number;
  cost_price: number;
  current_stock: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type Customers = {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  created_at: Date;
  updated_at: Date;
};

export type Suppliers = {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  created_at: Date;
  updated_at: Date;
};

export type Receivables = {
  id: string;
  description: string;
  amount: number;
  receipt_date: Date;
  received: boolean;
  customer_id: number;
  created_at: Date;
  updated_at: Date;
};

export type Payments = {
  id: string;
  description: string;
  amount: number;
  payment_date: Date;
  paid: boolean;
  payment_method: string;
  supplier_id: number;
  created_at: Date;
  updated_at: Date;
};

export type TodoList = {
  id: string;
  title: string;
  description?: string;
  due_date: Date;
  status: string;
  priority: string;
  created_at: Date;
  updated_at: Date;
};

export class CustomZDataClient extends ZDataClient {
  constructor(config: ApiConfig) {
    super(config);
  }

  /**
   * Products CRUD operations
   */

  findProductsById = (id: string) =>
    this.findRecordById<Products>("products", id);
  deleteProducts = (id: string) => this.deleteRecord("products", id);
  insertProducts = (data: Products) =>
    this.createRecord<Products>("products", data);
  updateProducts = (id: string, data: Products) =>
    this.updateRecord<Products>("products", id, data);
  findProductsPaged = (
    params: Pick<FindRecordsParams, "search" | "page" | "limit">
  ) => this.findRecords<Products>({ resourceName: "products", ...params });

  /**
   * Customers CRUD operations
   */

  findCustomersById = (id: string) =>
    this.findRecordById<Customers>("customers", id);
  deleteCustomers = (id: string) => this.deleteRecord("customers", id);
  insertCustomers = (data: Customers) =>
    this.createRecord<Customers>("customers", data);
  updateCustomers = (id: string, data: Customers) =>
    this.updateRecord<Customers>("customers", id, data);
  findCustomersPaged = (
    params: Pick<FindRecordsParams, "search" | "page" | "limit">
  ) => this.findRecords<Customers>({ resourceName: "customers", ...params });

  /**
   * Suppliers CRUD operations
   */

  findSuppliersById = (id: string) =>
    this.findRecordById<Suppliers>("suppliers", id);
  deleteSuppliers = (id: string) => this.deleteRecord("suppliers", id);
  insertSuppliers = (data: Suppliers) =>
    this.createRecord<Suppliers>("suppliers", data);
  updateSuppliers = (id: string, data: Suppliers) =>
    this.updateRecord<Suppliers>("suppliers", id, data);
  findSuppliersPaged = (
    params: Pick<FindRecordsParams, "search" | "page" | "limit">
  ) => this.findRecords<Suppliers>({ resourceName: "suppliers", ...params });

  /**
   * Receivables CRUD operations
   */

  findReceivablesById = (id: string) =>
    this.findRecordById<Receivables>("receivables", id);
  deleteReceivables = (id: string) => this.deleteRecord("receivables", id);
  insertReceivables = (data: Receivables) =>
    this.createRecord<Receivables>("receivables", data);
  updateReceivables = (id: string, data: Receivables) =>
    this.updateRecord<Receivables>("receivables", id, data);
  findReceivablesPaged = (
    params: Pick<FindRecordsParams, "search" | "page" | "limit">
  ) =>
    this.findRecords<Receivables>({ resourceName: "receivables", ...params });

  /**
   * Payments CRUD operations
   */

  findPaymentsById = (id: string) =>
    this.findRecordById<Payments>("payments", id);
  deletePayments = (id: string) => this.deleteRecord("payments", id);
  insertPayments = (data: Payments) =>
    this.createRecord<Payments>("payments", data);
  updatePayments = (id: string, data: Payments) =>
    this.updateRecord<Payments>("payments", id, data);
  findPaymentsPaged = (
    params: Pick<FindRecordsParams, "search" | "page" | "limit">
  ) => this.findRecords<Payments>({ resourceName: "payments", ...params });

  /**
   * TodoList CRUD operations
   */

  findTodoListById = (id: string) =>
    this.findRecordById<TodoList>("todo_list", id);
  deleteTodoList = (id: string) => this.deleteRecord("todo_list", id);
  insertTodoList = (data: TodoList) =>
    this.createRecord<TodoList>("todo_list", data);
  updateTodoList = (id: string, data: TodoList) =>
    this.updateRecord<TodoList>("todo_list", id, data);
  findTodoListPaged = (
    params: Pick<FindRecordsParams, "search" | "page" | "limit">
  ) => this.findRecords<TodoList>({ resourceName: "todo_list", ...params });
}
```

## 🔥 Practical Usage Examples

### Complete E-commerce System

```typescript
class EcommerceManager {
  private client: CustomZDataClient;

  constructor(client: CustomZDataClient) {
    this.client = client;
  }

  // Get products in stock
  async getAvailableProducts() {
    try {
      const products = await this.client.findProductsPaged({
        search: "active:true",
        page: 1,
        limit: 50,
      });

      return products.records.filter(
        (product) => product.active && product.current_stock > 0
      );
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  // Process order
  async processOrder(customerId: string, productIds: string[]) {
    try {
      // Check customer
      const customer = await this.client.findCustomersById(customerId);
      console.log(`📝 Processing order for: ${customer.name}`);

      // Check products
      for (const productId of productIds) {
        const product = await this.client.findProductsById(productId);

        if (!product.active || product.current_stock <= 0) {
          throw new Error(`Product ${product.name} not available`);
        }
      }

      console.log("✅ Order processed successfully");
    } catch (error) {
      if (isApiClientError(error) && error.statusCode === 404) {
        console.error("❌ Customer or product not found");
      } else {
        console.error("❌ Error processing order:", error.message);
      }
    }
  }

  // Financial report
  async financialReport(startDate: Date, endDate: Date) {
    try {
      // Get receivables for the period
      const receivables = await this.client.findReceivablesPaged({
        search: `receipt_date:${startDate.toISOString()},${endDate.toISOString()}`,
        limit: 1000,
      });

      // Get payments for the period
      const payments = await this.client.findPaymentsPaged({
        search: `payment_date:${startDate.toISOString()},${endDate.toISOString()}`,
        limit: 1000,
      });

      const totalReceived = receivables.records
        .filter((r) => r.received)
        .reduce((sum, r) => sum + r.amount, 0);

      const totalPaid = payments.records
        .filter((p) => p.paid)
        .reduce((sum, p) => sum + p.amount, 0);

      console.log("💰 Financial Report:");
      console.log(`📈 Total Received: $${totalReceived.toFixed(2)}`);
      console.log(`📉 Total Paid: $${totalPaid.toFixed(2)}`);
      console.log(`💵 Balance: $${(totalReceived - totalPaid).toFixed(2)}`);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  }
}
```

### Task Manager

```typescript
class TaskManager {
  private client: CustomZDataClient;

  constructor(client: CustomZDataClient) {
    this.client = client;
  }

  async createTask(
    title: string,
    description?: string,
    priority: string = "medium"
  ) {
    try {
      const newTask: TodoList = {
        id: "",
        title,
        description,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: "pending",
        priority,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const task = await this.client.insertTodoList(newTask);
      console.log(`✅ Task created: ${task.title}`);
      return task;
    } catch (error) {
      if (isValidationError(error)) {
        console.error("❌ Invalid task data:");
        error.errors.forEach((err) => console.error(`• ${err.message}`));
      }
      throw error;
    }
  }

  async listPendingTasks() {
    try {
      const tasks = await this.client.findTodoListPaged({
        search: "status:pending",
        page: 1,
        limit: 100,
      });

      console.log(`📋 ${tasks.meta.totalRecords} pending tasks:`);

      tasks.records
        .sort(
          (a, b) =>
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )
        .forEach((task) => {
          const dueDate = new Date(task.due_date);
          const today = new Date();
          const daysRemaining = Math.ceil(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          let emoji = "📅";
          if (daysRemaining < 0) emoji = "🚨"; // Overdue
          else if (daysRemaining <= 1) emoji = "⚡"; // Urgent
          else if (task.priority === "high") emoji = "🔥";

          console.log(`${emoji} ${task.title} (${daysRemaining} days)`);
          if (task.description) {
            console.log(`   ${task.description}`);
          }
        });
    } catch (error) {
      console.error("Error listing tasks:", error);
    }
  }
}
```

## 🚀 Advanced Usage

### Smart Pagination

```typescript
async function getAllCustomers() {
  let allCustomers: Customers[] = [];
  let currentPage = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    try {
      const result = await client.findRecords<Customers>({
        resourceName: "customers",
        page: currentPage,
        limit: 100,
      });

      allCustomers.push(...result.records);

      console.log(`📄 Page ${currentPage}: ${result.records.length} customers`);

      hasMorePages = result.meta.hasNext;
      currentPage++;
    } catch (error) {
      console.error(`Error on page ${currentPage}:`, error);
      break;
    }
  }

  console.log(`✅ Total customers loaded: ${allCustomers.length}`);
  return allCustomers;
}
```

### Retry with Backoff

```typescript
async function operationWithRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error; // Last attempt, propagate error
      }

      if (isApiClientError(error) && error.statusCode === 429) {
        // Rate limit - wait before trying again
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(
          `⏱️ Rate limit - waiting ${delay}ms before attempt ${attempt + 1}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error; // Non-rate-limit error
      }
    }
  }

  throw new Error("Maximum retry attempts exceeded");
}

// Using retry
await operationWithRetry(async () => {
  return await client.findRecords({
    resourceName: "products",
    limit: 1000,
  });
});
```

## 📚 Complete Type Reference

### Error Responses

```typescript
// Validation error (400)
interface ValidationErrorDetail {
  code: string; // "REQUIRED_FIELD", "INVALID_EMAIL", etc.
  path: string[]; // ["email"] or ["product", "price"]
  message: string; // "Email field is required"
}

// Authentication response
interface AuthResponse {
  access_token: string; // JWT token
  expires_in: number; // Seconds until expiration
  token_type: string; // "Bearer"
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// Paginated response
interface PaginatedResponse<T> {
  records: T[]; // Array of records
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

## 🎯 Best Practices

1. **Always handle specific errors** using type guards
2. **Save tokens securely** (never in localStorage in production)
3. **Use pagination** for large datasets
4. **Implement retry** for critical operations
5. **Validate data** before sending to API
6. **Use TypeScript** to leverage complete typing

## 🤝 Support

For questions and issues, consult the complete documentation or open an issue in the repository.
