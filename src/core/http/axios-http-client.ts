import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  HttpClient,
  HttpRequest,
  HttpResponse,
} from './http-client.interface';
import { HttpError } from '../errors/http-error';

// Timeout Constants
const TIMEOUT = {
  DEFAULT_MS: 10000,
} as const;

export class AxiosHttpClient implements HttpClient {
  private readonly instance: AxiosInstance;

  public constructor(baseURL: string, defaultTimeout = TIMEOUT.DEFAULT_MS) {
    this.instance = axios.create({
      baseURL,
      timeout: defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  public async request<T = unknown>(
    request: HttpRequest,
  ): Promise<HttpResponse<T>> {
    try {
      const config = {
        url: request.url,
        method: request.method,
        ...(request.headers !== undefined && { headers: request.headers }),
        ...(request.data !== undefined && { data: request.data }),
        ...(request.params !== undefined && { params: request.params }),
        ...(request.timeout !== undefined && { timeout: request.timeout }),
      };

      const response = await this.instance.request(config);

      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): HttpError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return new HttpError(
        axiosError.message,
        axiosError.response?.status,
        axiosError.response?.data,
      );
    }

    if (error instanceof Error) {
      return new HttpError(error.message);
    }

    return new HttpError('Unknown HTTP error occurred');
  }
}
