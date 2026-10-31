import type { NextFunction, Request, Response } from 'express';

import { ErrorCode } from '@repo/contracts';

import { AppException } from '../exceptions';
import { ACCESS_COOKIE, readCookie, REFRESH_COOKIE } from './auth-cookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Cookies are sent by the browser on cross-site requests too, so a request that
 * authenticates with a cookie must prove it comes from our own web app. SameSite=Lax
 * already blocks most of it; checking `Origin` closes the rest (sibling subdomains,
 * top-level POST navigations). Bearer clients (mobile) carry no cookie and skip this.
 */
export function csrfMiddleware(allowedOrigins: readonly string[]) {
  const allowed = new Set(allowedOrigins);
  return (req: Request, _res: Response, next: NextFunction): void => {
    const usesCookie = readCookie(req, ACCESS_COOKIE) ?? readCookie(req, REFRESH_COOKIE);
    if (!usesCookie || SAFE_METHODS.has(req.method)) return next();

    const origin = req.headers.origin ?? originOf(req.headers.referer);
    if (origin && allowed.has(origin)) return next();
    next(new AppException(ErrorCode.FORBIDDEN, { message: 'Cross-site request rejected' }));
  };
}

function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}
