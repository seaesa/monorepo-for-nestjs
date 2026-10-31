import { isAxiosError } from 'axios';

import { type ApiErrorBody, ErrorCode, type FieldError, isApiErrorBody } from '@repo/contracts';
import { resources } from '@repo/i18n';

/** Debug text only — UIs translate by `code` (`translateError`). */
const fallback = resources.en.errors;

/** Every failed request rejects with this. Switch on `code`, never on `message`. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fieldErrors: FieldError[];
  readonly requestId?: string;

  constructor(body: Pick<ApiErrorBody, 'code' | 'message' | 'statusCode'> & Partial<ApiErrorBody>) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.status = body.statusCode;
    this.fieldErrors = body.fieldErrors ?? [];
    this.requestId = body.requestId;
  }

  is(code: ErrorCode): boolean {
    return this.code === code;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    if (isApiErrorBody(error.response?.data)) return new ApiError(error.response.data);
    if (!error.response) {
      return new ApiError({
        code: ErrorCode.NETWORK_ERROR,
        message: fallback.NETWORK_ERROR,
        statusCode: 0,
      });
    }
    return new ApiError({
      code: ErrorCode.INTERNAL_ERROR,
      message: fallback.INTERNAL_ERROR,
      statusCode: error.response.status,
    });
  }
  return new ApiError({
    code: ErrorCode.INTERNAL_ERROR,
    message: fallback.INTERNAL_ERROR,
    statusCode: 0,
  });
}
