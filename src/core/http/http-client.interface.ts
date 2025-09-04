export interface HttpRequest {
  readonly url: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly headers?: Record<string, string>;
  readonly data?: unknown;
  readonly params?: Record<string, string>;
  readonly timeout?: number;
}

export interface HttpResponse<T = unknown> {
  readonly data: T;
  readonly status: number;
  readonly headers: Record<string, string>;
}

export interface HttpClient {
  request<T = unknown>(request: HttpRequest): Promise<HttpResponse<T>>;
}
