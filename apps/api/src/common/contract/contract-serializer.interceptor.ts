import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

import { getRoute } from './endpoint.decorator';

/**
 * Runs every handler result through the route's `response` schema:
 * strips fields not in the contract (e.g. `passwordHash`) and converts Dates to ISO strings.
 * A mismatch is a server bug and surfaces as a 500.
 */
@Injectable()
export class ContractSerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const route = context.getType() === 'http' ? getRoute(context) : undefined;
    if (!route) return next.handle();
    return next.handle().pipe(map((data: unknown) => route.response.parse(data)));
  }
}
