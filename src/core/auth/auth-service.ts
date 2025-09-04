import type { HttpClient } from '../http/http-client.interface';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '../../features/validation/schemas';
import { Validator } from '../../features/validation/validator';
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  AuthResponseSchema,
} from '../../features/validation/schemas';
import { InvalidCredentialsError, ApiClientError } from '../errors/api-errors';

// HTTP Status Code Constants
const HTTP_STATUS = {
  UNAUTHORIZED: 401,
} as const;
import { HttpError } from '../errors/http-error';

export class AuthService {
  private accessToken: string | null = null;

  public constructor(private readonly httpClient: HttpClient) {}

  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    const validatedCredentials = Validator.validate(
      LoginRequestSchema,
      credentials,
    );

    try {
      const response = await this.httpClient.request<AuthResponse>({
        method: 'POST',
        url: '/login',
        data: validatedCredentials,
      });

      const authResponse = Validator.validate(
        AuthResponseSchema,
        response.data,
      );
      this.setAccessToken(authResponse.access_token);

      return authResponse;
    } catch (error) {
      if (
        error instanceof HttpError &&
        error.statusCode === HTTP_STATUS.UNAUTHORIZED
      ) {
        throw new InvalidCredentialsError('Invalid email or password');
      }

      if (error instanceof HttpError) {
        throw new ApiClientError(error.message, error.statusCode);
      }

      throw error;
    }
  }

  public async register(userData: RegisterRequest): Promise<AuthResponse> {
    const validatedUserData = Validator.validate(
      RegisterRequestSchema,
      userData,
    );

    try {
      const response = await this.httpClient.request<AuthResponse>({
        method: 'POST',
        url: '/register',
        data: validatedUserData,
      });

      const authResponse = Validator.validate(
        AuthResponseSchema,
        response.data,
      );
      this.setAccessToken(authResponse.access_token);

      return authResponse;
    } catch (error) {
      if (error instanceof HttpError) {
        throw new ApiClientError(error.message, error.statusCode);
      }

      throw error;
    }
  }

  public logout(): void {
    this.accessToken = null;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.accessToken);
  }

  public setAccessToken(token: string): void {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid access token: must be a non-empty string');
    }
    this.accessToken = token;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getAuthHeader(): Record<string, string> {
    return this.accessToken
      ? { Authorization: `Bearer ${this.accessToken}` }
      : {};
  }
}
