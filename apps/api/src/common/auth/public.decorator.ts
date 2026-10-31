import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';

import type { ClientInfo } from './auth-user';

export const PUBLIC_KEY = 'auth:public';

/**
 * Opt a handler (or controller) out of authentication.
 *
 * Only for infrastructure endpoints that are not part of the contract — contract
 * routes already declare `auth: false`. Without this marker, `AuthGuard` denies:
 * forgetting `@Endpoint` must never open an endpoint.
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/** Device metadata for the current request, stored with the refresh-token session. */
/** Matches the stored column size; longer agents are noise. */
const MAX_USER_AGENT_LENGTH = 255;

export const ClientMeta = createParamDecorator((_: unknown, ctx: ExecutionContext): ClientInfo => {
  const req = ctx.switchToHttp().getRequest<Request>();
  const userAgent = req.headers['user-agent'];
  return {
    userAgent: typeof userAgent === 'string' ? userAgent.slice(0, MAX_USER_AGENT_LENGTH) : null,
    ip: req.ip ?? null,
  };
});
