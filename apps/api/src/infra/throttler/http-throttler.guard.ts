import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limits apply to HTTP only.
 *
 * `ThrottlerGuard` writes `X-RateLimit-*` headers through the HTTP response
 * object, which does not exist on a websocket context, so leaving it global
 * without this guard breaks every `@SubscribeMessage` handler at runtime.
 */
@Injectable()
export class HttpThrottlerGuard extends ThrottlerGuard {
  override canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return Promise.resolve(true);
    return super.canActivate(context);
  }
}
