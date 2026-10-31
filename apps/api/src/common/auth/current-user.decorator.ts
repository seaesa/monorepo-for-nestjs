import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AuthUser } from './auth-user';

/** The authenticated user. Only valid on routes with `auth` not set to `false`. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<{ user: AuthUser }>().user;
});
