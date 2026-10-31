import { HttpException } from '@nestjs/common';

import { type ErrorCode, errorStatus, type FieldError } from '@repo/contracts';
import { resources } from '@repo/i18n';

export interface AppExceptionOptions {
  message?: string;
  /** Bind the error to one form field, e.g. `email` for AUTH_EMAIL_TAKEN. */
  field?: string;
  fieldErrors?: FieldError[];
  cause?: unknown;
}

/**
 * The only exception services should throw.
 * `throw new AppException(ErrorCode.NOT_FOUND)`
 */
export class AppException extends HttpException {
  readonly code: ErrorCode;
  readonly fieldErrors?: FieldError[];

  constructor(code: ErrorCode, options: AppExceptionOptions = {}) {
    // English text for logs and API consumers; frontends translate by `code`.
    const message = options.message ?? resources.en.errors[code];
    super(message, errorStatus[code], { cause: options.cause });
    this.code = code;
    this.fieldErrors =
      options.fieldErrors ?? (options.field ? [{ path: options.field, code, message }] : undefined);
  }
}
