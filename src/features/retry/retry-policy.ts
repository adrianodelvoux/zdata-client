// HTTP Status Code Constants
const RETRYABLE_STATUS_CODES = {
  REQUEST_TIMEOUT: 408,
  TOO_MANY_REQUESTS: 429,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export interface RetryConfig {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
  readonly jitterMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterMs: 100,
};

export class RetryPolicy {
  public constructor(
    private readonly config: RetryConfig = DEFAULT_RETRY_CONFIG,
  ) {}

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.config.maxAttempts || !this.shouldRetry(error)) {
          break;
        }

        await this.delay(this.calculateDelay(attempt));
      }
    }

    throw lastError ?? new Error('Unknown retry error');
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      return error.name === 'HttpError' && this.isRetryableStatusCode(error);
    }
    return false;
  }

  private isRetryableStatusCode(
    error: Error & { statusCode?: number },
  ): boolean {
    if (!error.statusCode) {
      return true; // Network errors are retryable
    }

    return [
      RETRYABLE_STATUS_CODES.REQUEST_TIMEOUT,
      RETRYABLE_STATUS_CODES.TOO_MANY_REQUESTS,
      RETRYABLE_STATUS_CODES.BAD_GATEWAY,
      RETRYABLE_STATUS_CODES.SERVICE_UNAVAILABLE,
      RETRYABLE_STATUS_CODES.GATEWAY_TIMEOUT,
    ].includes(error.statusCode);
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay =
      this.config.baseDelayMs *
      Math.pow(this.config.backoffMultiplier, attempt - 1);

    const delayWithJitter =
      exponentialDelay + Math.random() * this.config.jitterMs;

    return Math.min(delayWithJitter, this.config.maxDelayMs);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
      globalThis.setTimeout(resolve, ms);
    });
  }
}
