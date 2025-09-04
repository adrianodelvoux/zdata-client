// HTTP Status Code Constants
const HTTP_STATUS = {
  CLIENT_ERROR_START: 400,
  SERVER_ERROR_START: 500,
} as const;

export class HttpError extends Error {
  public readonly name = 'HttpError';
  public readonly statusCode?: number;
  public readonly response?: unknown;

  public constructor(message: string, statusCode?: number, response?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.response = response;
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  public isClientError(): boolean {
    return Boolean(
      this.statusCode &&
        this.statusCode >= HTTP_STATUS.CLIENT_ERROR_START &&
        this.statusCode < HTTP_STATUS.SERVER_ERROR_START,
    );
  }

  public isServerError(): boolean {
    return Boolean(
      this.statusCode && this.statusCode >= HTTP_STATUS.SERVER_ERROR_START,
    );
  }

  public isNetworkError(): boolean {
    return !this.statusCode;
  }
}
