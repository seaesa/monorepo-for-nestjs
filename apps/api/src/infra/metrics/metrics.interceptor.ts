import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { type Observable, tap } from 'rxjs';

import { MetricsService } from './metrics.service';

/** Records request count and latency for every HTTP handler. */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    // Scrapes would otherwise dominate the histogram and tell us nothing about users.
    if (request.path === '/metrics') return next.handle();

    const response = context.switchToHttp().getResponse<Response>();
    // Controller+handler instead of the raw URL: the raw path is unbounded (ids, search
    // terms) and would blow up the metric label cardinality.
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    const labels = { method: request.method, route };
    const stopTimer = this.metrics.httpDuration.startTimer(labels);

    let recorded = false;
    const record = (status: number): void => {
      if (recorded) return;
      recorded = true;
      const statusLabel = String(status);
      stopTimer({ status: statusLabel });
      this.metrics.httpRequests.inc({ ...labels, status: statusLabel });
    };

    return next.handle().pipe(
      tap({
        next: () => record(response.statusCode),
        // The exception filter sets the response status later, so read it off the error.
        error: (error: unknown) =>
          record(
            error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
          ),
      }),
    );
  }
}
