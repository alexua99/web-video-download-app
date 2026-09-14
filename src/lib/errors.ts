import type { ErrorCode } from "@/lib/i18n";

export class AppError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode) {
    super(code);
    this.name = "AppError";
    this.code = code;
  }
}

export class UrlError extends AppError {
  constructor(code: ErrorCode) {
    super(code);
    this.name = "UrlError";
  }
}

export class YtDlpError extends AppError {
  constructor(code: ErrorCode) {
    super(code);
    this.name = "YtDlpError";
  }
}

export class LimitError extends AppError {
  status: number;
  retryAfter?: number;

  constructor(code: ErrorCode, status: number, retryAfter?: number) {
    super(code);
    this.name = "LimitError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}
