import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import * as Sentry from '@sentry/nestjs';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

import { type ApiErrorBody, ErrorCode } from '@repo/contracts';

import { Prisma } from '../../generated/prisma/client';
import { AppException } from './app.exception';
import { validationException } from './zod-error';

const codeByStatus: Partial<Record<number, ErrorCode>> = {
  400: ErrorCode.BAD_REQUEST,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
  422: ErrorCode.VALIDATION_FAILED,
  429: ErrorCode.RATE_LIMITED,
  503: ErrorCode.SERVICE_UNAVAILABLE,
};

/**
 * Infrastructure failures (Redis unreachable, socket closed mid-command) are not
 * application bugs: report them as 503 so clients retry and probes see the truth,
 * instead of a 500 that suggests the request itself was wrong.
 */
function isInfrastructureFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const name = error.constructor.name;
  return (
    name === 'MaxRetriesPerRequestError' ||
    name === 'AbortError' ||
    /Connection is closed|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|Stream isn't writeable/i.test(
      error.message,
    )
  );
}

/** Normalizes every thrown value into `ApiErrorBody`. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') return;

    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const res = ctx.getResponse<Response>();
    const appException = this.toAppException(exception);

    const body: ApiErrorBody = {
      statusCode: appException.getStatus(),
      code: appException.code,
      message: appException.message,
      fieldErrors: appException.fieldErrors,
      requestId: req.id,
      timestamp: new Date().toISOString(),
      path: req.url,
    };

    if (body.statusCode >= (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      this.logger.error({ err: exception, requestId: req.id }, 'Unhandled exception');
      Sentry.captureException(exception, { tags: { requestId: req.id } });
    }

    res.status(body.statusCode).json(body);
  }

  private toAppException(exception: unknown): AppException {
    if (exception instanceof AppException) return exception;
    if (exception instanceof ZodError) return validationException(exception);
    if (exception instanceof ThrottlerException) return new AppException(ErrorCode.RATE_LIMITED);

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002')
        return new AppException(ErrorCode.CONFLICT, { cause: exception });
      if (exception.code === 'P2025')
        return new AppException(ErrorCode.NOT_FOUND, { cause: exception });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = codeByStatus[status] ?? ErrorCode.INTERNAL_ERROR;
      // Framework messages (`Cannot GET /nope`, `Bad Request`) leak routing details
      // and are not localizable. Every message comes from the error code
      // or from an `AppException` thrown by a service.
      return new AppException(code, { cause: exception });
    }

    if (isInfrastructureFailure(exception)) {
      return new AppException(ErrorCode.SERVICE_UNAVAILABLE, { cause: exception });
    }

    return new AppException(ErrorCode.INTERNAL_ERROR, { cause: exception });
  }
}
