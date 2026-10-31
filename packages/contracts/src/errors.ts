import { z } from 'zod';

/**
 * Every error the API can return. The backend throws `AppException(ErrorCode.X)`,
 * the frontend switches on `code` — never on `message` or HTTP status alone.
 *
 * Naming: generic codes are bare, domain codes are `<DOMAIN>_<REASON>`.
 * Adding a code? Add its HTTP status to `errorStatus` and its text to the `errors` namespace of
 * every locale in `@repo/i18n` — both are typed `Record<ErrorCode, …>`, so a gap fails the build.
 */
export const ErrorCode = {
  // generic
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  /** Client-side only: the request never reached the server. */
  NETWORK_ERROR: 'NETWORK_ERROR',
  // auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_TAKEN: 'AUTH_EMAIL_TAKEN',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_RESET_TOKEN_INVALID: 'AUTH_RESET_TOKEN_INVALID',
  AUTH_VERIFICATION_TOKEN_INVALID: 'AUTH_VERIFICATION_TOKEN_INVALID',
  AUTH_SESSION_NOT_FOUND: 'AUTH_SESSION_NOT_FOUND',
  // tasks
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const errorStatus: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 422,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  // Client-only: the request never reached the server, so the API never sends it.
  NETWORK_ERROR: 503,
  AUTH_INVALID_CREDENTIALS: 401,
  AUTH_EMAIL_TAKEN: 409,
  AUTH_EMAIL_NOT_VERIFIED: 403,
  AUTH_TOKEN_EXPIRED: 401,
  AUTH_TOKEN_INVALID: 401,
  AUTH_RESET_TOKEN_INVALID: 400,
  AUTH_VERIFICATION_TOKEN_INVALID: 400,
  AUTH_SESSION_NOT_FOUND: 404,
  TASK_NOT_FOUND: 404,
};

/**
 * A problem with one input field. `path` is dot-notation, e.g. `items.0.name`.
 * `code` is a zod issue code (`too_small`, `invalid_format`, ...) or an `ErrorCode`; frontends
 * translate `code` + `params`. `message` is English, for logs only.
 */
export const fieldErrorSchema = z.object({
  path: z.string(),
  code: z.string(),
  message: z.string(),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export interface FieldError extends z.output<typeof fieldErrorSchema> {
  code: ErrorCode | (string & {});
}

/** The body of every non-2xx API response. */
export const apiErrorBodySchema = z
  .object({
    statusCode: z.number(),
    code: z.enum(ErrorCode),
    message: z.string(),
    /** Present for VALIDATION_FAILED and for domain errors bound to a field. */
    fieldErrors: z.array(fieldErrorSchema).optional(),
    requestId: z.string().optional(),
    timestamp: z.string(),
    path: z.string(),
  })
  .meta({ id: 'ApiError' });
export interface ApiErrorBody extends Omit<z.output<typeof apiErrorBodySchema>, 'fieldErrors'> {
  fieldErrors?: FieldError[];
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'code' in value && 'statusCode' in value;
}

const ISSUE_PARAM_KEYS = ['minimum', 'maximum', 'origin', 'format', 'expected', 'divisor'] as const;

/**
 * The translatable part of a zod issue. Shared by the API (field errors on the wire) and the
 * frontends (local form validation) so both produce the same `code` + `params`.
 */
export function issueParams(issue: object): FieldError['params'] {
  const params: NonNullable<FieldError['params']> = {};
  for (const key of ISSUE_PARAM_KEYS) {
    const value: unknown = (issue as Record<string, unknown>)[key];
    if (typeof value === 'string' || typeof value === 'boolean') params[key] = value;
    else if (typeof value === 'number' || typeof value === 'bigint') params[key] = Number(value);
  }
  return Object.keys(params).length > 0 ? params : undefined;
}
