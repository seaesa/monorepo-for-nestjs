import type { z } from 'zod';

import { ErrorCode, type FieldError, issueParams } from '@repo/contracts';

import { AppException } from './app.exception';

function toFieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    code: issue.code,
    message: issue.message,
    params: issueParams(issue),
  }));
}

export function validationException(error: z.ZodError): AppException {
  return new AppException(ErrorCode.VALIDATION_FAILED, { fieldErrors: toFieldErrors(error) });
}
