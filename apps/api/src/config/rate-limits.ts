import type { Throttle } from '@nestjs/throttler';

import { MS_PER_SECOND, SECONDS_PER_MINUTE } from '../common/time';

const WINDOW_MS = SECONDS_PER_MINUTE * MS_PER_SECOND;

/** Requests per minute per client IP. Auth routes are tighter because they are brute-force targets. */
export const rateLimits = {
  global: 120,
  register: 20,
  login: 10,
  refresh: 60,
  forgotPassword: 5,
  resetPassword: 5,
  verifyEmail: 10,
  resendVerification: 3,
} as const;

/** `@Throttle(perMinute(rateLimits.login))` */
export function perMinute(limit: number): Parameters<typeof Throttle>[0] {
  return { default: { limit, ttl: WINDOW_MS } };
}

export const globalThrottler = { limit: rateLimits.global, ttl: WINDOW_MS };
