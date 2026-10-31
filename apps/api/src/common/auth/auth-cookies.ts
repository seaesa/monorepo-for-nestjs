import type { CookieOptions, Request, Response } from 'express';

import { AUTH_MODE_COOKIE, AUTH_MODE_HEADER, type AuthTokens } from '@repo/contracts';

import { MS_PER_SECOND } from '../../common/time';
import type { Env } from '../../config/env';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
/** The refresh cookie is only ever sent to the auth routes that consume it. */
const REFRESH_PATH = '/auth';

type CookieEnv = Pick<Env, 'NODE_ENV' | 'COOKIE_DOMAIN' | 'JWT_REFRESH_TTL'>;

export function isCookieMode(req: Request): boolean {
  return req.headers[AUTH_MODE_HEADER] === AUTH_MODE_COOKIE;
}

export function readCookie(req: Request, name: string): string | undefined {
  const value: unknown = (req.cookies as Record<string, unknown> | undefined)?.[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function baseOptions(env: CookieEnv): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    domain: env.COOKIE_DOMAIN,
  };
}

export function setAuthCookies(res: Response, tokens: AuthTokens, env: CookieEnv): void {
  const options = baseOptions(env);
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...options,
    path: '/',
    maxAge: tokens.expiresIn * MS_PER_SECOND,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...options,
    path: REFRESH_PATH,
    maxAge: env.JWT_REFRESH_TTL * MS_PER_SECOND,
  });
}

export function clearAuthCookies(res: Response, env: CookieEnv): void {
  const options = baseOptions(env);
  res.clearCookie(ACCESS_COOKIE, { ...options, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...options, path: REFRESH_PATH });
}
