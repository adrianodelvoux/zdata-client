# Frontend Error Handling Guide for ZData Client

This guide provides comprehensive documentation for handling errors in frontend applications using the ZData Client library.

## Error Types Overview

The ZData Client provides three main error types with corresponding type guards for robust error handling:

### 1. InvalidCredentialsError
- **When**: Authentication failures (401 status)
- **Use case**: Login/authentication forms, missing/invalid JWT tokens
- **Properties**: `name`, `message`
- **Common scenarios**: Invalid login credentials, expired JWT, missing Authorization header

### 2. ValidationError
- **When**: Data validation failures
- **Use case**: Form validation, API request validation
- **Properties**: `name`, `message`, `errors` (array of ValidationErrorDetail)

### 3. ApiClientError
- **When**: General API errors (network issues, server errors)
- **Use case**: Any API communication error
- **Properties**: `name`, `message`, `statusCode?`

## Import Statements

```typescript
import {
  InvalidCredentialsError,
  ValidationError,
  ApiClientError,
  isInvalidCredentialsError,
  isValidationError,
  isApiClientError,
  type ValidationErrorDetail
} from 'zdata-client';
```

## Type Guards and Error Identification

### Basic Error Handling Pattern

```typescript
try {
  const result = await zdataClient.someOperation();
} catch (error) {
  if (isInvalidCredentialsError(error)) {
    // Handle authentication errors (invalid login, expired JWT, missing token)
    console.log('Authentication failed:', error.message);
    clearStoredToken(); // Clear any stored JWT
    redirectToLogin();
  } else if (isValidationError(error)) {
    // Handle validation errors
    console.log('Validation failed:', error.message);
    displayFieldErrors(error.errors);
  } else if (isApiClientError(error)) {
    // Handle API errors
    console.log(`API Error (${error.statusCode}):`, error.message);
    showToast('error', error.message);
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
    showToast('error', 'An unexpected error occurred');
  }
}
```

## React Implementation Examples

### Error Boundary Component

```typescript
import React, { Component, ReactNode } from 'react';
import { isApiClientError, isValidationError, isInvalidCredentialsError } from 'zdata-client';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ZDataErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ZData Error Boundary caught an error:', error, errorInfo);
  }

  private getErrorMessage(): string {
    const { error } = this.state;
    if (!error) return 'An error occurred';

    if (isInvalidCredentialsError(error)) {
      return 'Please check your credentials and try again';
    } else if (isValidationError(error)) {
      return 'Please check your input and try again';
    } else if (isApiClientError(error)) {
      return error.statusCode === 500 
        ? 'Server error. Please try again later' 
        : error.message;
    }
    
    return 'An unexpected error occurred';
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!);
      }

      return (
        <div className="error-boundary">
          <h2>Oops! Something went wrong</h2>
          <p>{this.getErrorMessage()}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Login Form with Error Handling

```typescript
import React, { useState } from 'react';
import { isInvalidCredentialsError, isValidationError } from 'zdata-client';

interface LoginFormProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError('');

    try {
      await onLogin(formData);
    } catch (error) {
      if (isInvalidCredentialsError(error)) {
        setGeneralError('Invalid email or password. Please try again.');
      } else if (isValidationError(error)) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const fieldName = err.path.join('.');
          fieldErrors[fieldName] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        setGeneralError('Login failed. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {generalError && (
        <div className="alert alert-error">{generalError}</div>
      )}
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className={errors.password ? 'error' : ''}
        />
        {errors.password && <span className="error-text">{errors.password}</span>}
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

### Data Fetching Hook with Error Handling

```typescript
import { useState, useEffect } from 'react';
import { isApiClientError, isValidationError } from 'zdata-client';

interface UseDataFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useDataFetch<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
): UseDataFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const executeFetch = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      let errorMessage = 'An error occurred while fetching data';

      if (isApiClientError(err)) {
        if (err.statusCode === 404) {
          errorMessage = 'Data not found';
        } else if (err.statusCode === 500) {
          errorMessage = 'Server error. Please try again later';
        } else if (err.statusCode && err.statusCode >= 400) {
          errorMessage = err.message;
        }
      } else if (isValidationError(err)) {
        errorMessage = 'Invalid data received from server';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeFetch();
  }, deps);

  return {
    data,
    loading,
    error,
    retry: executeFetch
  };
}
```

## Vue.js Implementation Example

```typescript
// Vue 3 Composition API
import { ref, computed } from 'vue';
import { isInvalidCredentialsError, isValidationError, isApiClientError } from 'zdata-client';

export function useErrorHandling() {
  const errors = ref<Record<string, string>>({});
  const generalError = ref<string>('');

  const hasErrors = computed(() => 
    Object.keys(errors.value).length > 0 || !!generalError.value
  );

  const clearErrors = () => {
    errors.value = {};
    generalError.value = '';
  };

  const handleError = (error: unknown) => {
    clearErrors();

    if (isInvalidCredentialsError(error)) {
      generalError.value = 'Invalid credentials. Please try again.';
    } else if (isValidationError(error)) {
      error.errors.forEach(err => {
        const fieldName = err.path.join('.');
        errors.value[fieldName] = err.message;
      });
    } else if (isApiClientError(error)) {
      generalError.value = error.statusCode === 500 
        ? 'Server error. Please try again later.'
        : error.message;
    } else {
      generalError.value = 'An unexpected error occurred';
    }
  };

  return {
    errors: readonly(errors),
    generalError: readonly(generalError),
    hasErrors,
    clearErrors,
    handleError
  };
}
```

## Validation Error Details

The `ValidationError` contains an array of `ValidationErrorDetail` objects with the following structure:

```typescript
interface ValidationErrorDetail {
  readonly code: string;        // Error code (e.g., "invalid_type", "too_small")
  readonly path: readonly string[];  // Path to the field (e.g., ["user", "email"])
  readonly message: string;     // Human-readable error message
}
```

### Working with Validation Errors

```typescript
const displayValidationErrors = (validationError: ValidationError) => {
  validationError.errors.forEach(detail => {
    console.log(`Field: ${detail.path.join('.')}`);
    console.log(`Code: ${detail.code}`);
    console.log(`Message: ${detail.message}`);
  });
};

// Example: Convert to form field errors
const mapToFieldErrors = (validationError: ValidationError): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};
  
  validationError.errors.forEach(detail => {
    const fieldPath = detail.path.join('.');
    fieldErrors[fieldPath] = detail.message;
  });
  
  return fieldErrors;
};
```

## JWT Token Handling

### Missing or Invalid JWT Scenarios

When JWT tokens are missing, expired, or invalid, the API typically returns a 401 status, which triggers an `InvalidCredentialsError`:

```typescript
// JWT Token Management Utility
class TokenManager {
  private static readonly TOKEN_KEY = 'zdata_jwt_token';
  
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
  
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true; // Invalid token format
    }
  }
}

// Authentication interceptor for API calls
const makeAuthenticatedRequest = async (apiCall: () => Promise<any>) => {
  try {
    return await apiCall();
  } catch (error) {
    if (isInvalidCredentialsError(error)) {
      // JWT is missing, expired, or invalid
      console.log('Authentication failed - clearing token and redirecting');
      TokenManager.clearToken();
      
      // Redirect to login page
      window.location.href = '/login';
      throw error;
    }
    throw error;
  }
};

// Usage example
const fetchUserData = async () => {
  const token = TokenManager.getToken();
  
  if (!token) {
    throw new InvalidCredentialsError('No authentication token found');
  }
  
  if (TokenManager.isTokenExpired(token)) {
    TokenManager.clearToken();
    throw new InvalidCredentialsError('Authentication token has expired');
  }
  
  return makeAuthenticatedRequest(() => zdataClient.getCurrentUser());
};
```

### React Hook for JWT Management

```typescript
import { useState, useEffect, useCallback } from 'react';
import { isInvalidCredentialsError } from 'zdata-client';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    isLoading: true
  });

  // Check token on component mount
  useEffect(() => {
    const token = TokenManager.getToken();
    
    if (token && !TokenManager.isTokenExpired(token)) {
      setAuthState({
        isAuthenticated: true,
        token,
        isLoading: false
      });
    } else {
      if (token) {
        TokenManager.clearToken(); // Clear expired token
      }
      setAuthState({
        isAuthenticated: false,
        token: null,
        isLoading: false
      });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await zdataClient.login(credentials);
      TokenManager.setToken(response.access_token);
      
      setAuthState({
        isAuthenticated: true,
        token: response.access_token,
        isLoading: false
      });
      
      return response;
    } catch (error) {
      if (isInvalidCredentialsError(error)) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    TokenManager.clearToken();
    setAuthState({
      isAuthenticated: false,
      token: null,
      isLoading: false
    });
  }, []);

  const handleAuthError = useCallback((error: unknown) => {
    if (isInvalidCredentialsError(error)) {
      // Token is invalid/expired, force logout
      logout();
      return true; // Indicates auth error was handled
    }
    return false;
  }, [logout]);

  return {
    ...authState,
    login,
    logout,
    handleAuthError
  };
};
```

### Protected Route Component

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
```

## Status Code Handling

The `ApiClientError` includes optional `statusCode` property for HTTP status-specific handling:

```typescript
const handleApiError = (error: ApiClientError) => {
  switch (error.statusCode) {
    case 400:
      return 'Bad request. Please check your input.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return error.message || 'An API error occurred.';
  }
};
```

## Best Practices

### 1. User-Friendly Messages

```typescript
const getErrorMessage = (error: unknown): string => {
  if (isInvalidCredentialsError(error)) {
    return 'Please check your email and password';
  }
  
  if (isValidationError(error)) {
    return 'Please check the highlighted fields below';
  }
  
  if (isApiClientError(error)) {
    // Don't expose technical details to users
    return error.statusCode && error.statusCode >= 500 
      ? 'We\'re experiencing technical difficulties. Please try again later.'
      : 'Something went wrong. Please try again.';
  }
  
  return 'An unexpected error occurred';
};
```

### 2. Retry Strategies

```typescript
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation or credentials errors
      if (isValidationError(error) || isInvalidCredentialsError(error)) {
        throw error;
      }
      
      // Only retry on server errors or network issues
      if (isApiClientError(error) && error.statusCode && error.statusCode < 500) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};
```

### 3. Logging and Monitoring

```typescript
const logError = (error: unknown, context: string) => {
  const errorInfo: any = {
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };

  if (isInvalidCredentialsError(error)) {
    errorInfo.type = 'InvalidCredentialsError';
    errorInfo.message = error.message;
  } else if (isValidationError(error)) {
    errorInfo.type = 'ValidationError';
    errorInfo.message = error.message;
    errorInfo.validationErrors = error.errors;
  } else if (isApiClientError(error)) {
    errorInfo.type = 'ApiClientError';
    errorInfo.message = error.message;
    errorInfo.statusCode = error.statusCode;
  } else {
    errorInfo.type = 'UnknownError';
    errorInfo.message = error instanceof Error ? error.message : String(error);
  }

  // Send to your logging service
  console.error('ZData Client Error:', errorInfo);
  
  // Example: Send to monitoring service
  // monitoringService.captureError(errorInfo);
};
```

### 4. Global Error Handler

```typescript
// React Context for global error handling
import React, { createContext, useContext, useCallback } from 'react';

interface ErrorContextType {
  showError: (error: unknown) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((error: unknown) => {
    logError(error, 'Global Error Handler');
    setError(getErrorMessage(error));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, clearError }}>
      {children}
      {error && (
        <Toast 
          type="error" 
          message={error} 
          onClose={clearError}
        />
      )}
    </ErrorContext.Provider>
  );
};

export const useGlobalError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useGlobalError must be used within an ErrorProvider');
  }
  return context;
};
```

## Testing Error Handling

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ValidationError, InvalidCredentialsError, ApiClientError } from 'zdata-client';

describe('Error Handling', () => {
  it('should handle ValidationError correctly', () => {
    const validationError = new ValidationError('Validation failed', [
      { code: 'invalid_type', path: ['email'], message: 'Invalid email format' }
    ]);

    const fieldErrors = mapToFieldErrors(validationError);
    expect(fieldErrors.email).toBe('Invalid email format');
  });

  it('should handle InvalidCredentialsError correctly', () => {
    const error = new InvalidCredentialsError('Invalid login');
    const message = getErrorMessage(error);
    expect(message).toBe('Please check your email and password');
  });

  it('should handle ApiClientError with status code', () => {
    const error = new ApiClientError('Server error', 500);
    const message = handleApiError(error);
    expect(message).toBe('Server error. Please try again later.');
  });
});
```

This comprehensive guide covers all aspects of error handling with the ZData Client library, providing practical examples for different frontend frameworks and scenarios.