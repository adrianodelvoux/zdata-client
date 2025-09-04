import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth-service';
import type { HttpClient } from '../http/http-client.interface';
import { InvalidCredentialsError } from '../errors/api-errors';
import { HttpError } from '../errors/http-error';

describe('AuthService', () => {
  let authService: AuthService;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    mockHttpClient = {
      request: vi.fn(),
    };
    authService = new AuthService(mockHttpClient);
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        data: {
          access_token: 'mock-token',
          expires_in: 3600,
          token_type: 'Bearer',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          },
        },
        status: 200,
        headers: {},
      };

      vi.mocked(mockHttpClient.request).mockResolvedValue(mockResponse);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(credentials);

      expect(result).toEqual(mockResponse.data);
      expect(authService.getAccessToken()).toBe('mock-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should throw InvalidCredentialsError for 401 response', async () => {
      vi.mocked(mockHttpClient.request).mockRejectedValue(
        new HttpError('Unauthorized', 401),
      );

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toThrow(
        InvalidCredentialsError,
      );
    });

    it('should validate email format', async () => {
      const credentials = {
        email: 'invalid-email',
        password: 'password123',
      };

      await expect(authService.login(credentials)).rejects.toThrow();
    });

    it('should require password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: '',
      };

      await expect(authService.login(credentials)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should clear access token', () => {
      authService.setAccessToken('test-token');
      expect(authService.isAuthenticated()).toBe(true);

      authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getAccessToken()).toBe(null);
    });
  });

  describe('setAccessToken', () => {
    it('should set valid token', () => {
      const token = 'valid-token';
      authService.setAccessToken(token);

      expect(authService.getAccessToken()).toBe(token);
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should reject empty token', () => {
      expect(() => authService.setAccessToken('')).toThrow();
    });

    it('should reject non-string token', () => {
      expect(() =>
        authService.setAccessToken(null as unknown as string),
      ).toThrow();
    });
  });

  describe('getAuthHeader', () => {
    it('should return authorization header when authenticated', () => {
      authService.setAccessToken('test-token');

      const headers = authService.getAuthHeader();

      expect(headers).toEqual({ Authorization: 'Bearer test-token' });
    });

    it('should return empty object when not authenticated', () => {
      const headers = authService.getAuthHeader();

      expect(headers).toEqual({});
    });
  });
});
