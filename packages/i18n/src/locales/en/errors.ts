import type { ErrorCode } from '@repo/contracts';

export const errors = {
  VALIDATION_FAILED: 'Some fields are invalid.',
  BAD_REQUEST: 'The request is invalid.',
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to do this.',
  NOT_FOUND: 'The resource was not found.',
  CONFLICT: 'The resource already exists.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again.',
  NETWORK_ERROR: 'Cannot reach the server. Check your connection.',
  AUTH_INVALID_CREDENTIALS: 'Email or password is incorrect.',
  AUTH_EMAIL_TAKEN: 'This email is already registered.',
  AUTH_EMAIL_NOT_VERIFIED: 'Please verify your email before signing in.',
  AUTH_TOKEN_EXPIRED: 'Your session has expired.',
  AUTH_TOKEN_INVALID: 'Your session is invalid. Please sign in again.',
  AUTH_RESET_TOKEN_INVALID: 'This password reset link is invalid or has expired.',
  AUTH_VERIFICATION_TOKEN_INVALID: 'This verification link is invalid or has expired.',
  AUTH_SESSION_NOT_FOUND: 'That session no longer exists.',
  TASK_NOT_FOUND: 'This task no longer exists.',
} as const satisfies Record<ErrorCode, string>;
