import { z } from 'zod';

import { localeSchema, okResponseSchema, zDateTime, zEmail, zId } from '../common';
import { limits } from '../limits';
import { defineRoute } from '../route';
import { ValidationMessage } from '../validation';

/**
 * Web sends `x-auth-mode: cookie`: the API then keeps tokens in httpOnly cookies and leaves them
 * out of response bodies. Without the header (mobile) tokens travel in the body as bearer tokens.
 */
export const AUTH_MODE_HEADER = 'x-auth-mode';
export const AUTH_MODE_COOKIE = 'cookie';

/** USER: own data only. ADMIN: every record. Granted in the database, never by the API. */
export const roles = ['USER', 'ADMIN'] as const;
export const roleSchema = z.enum(roles);
export type Role = z.output<typeof roleSchema>;

export const userSchema = z
  .object({
    id: zId,
    email: z.email(),
    name: z.string(),
    /** Null until the address is confirmed; informational unless the API requires verification. */
    emailVerifiedAt: zDateTime.nullable(),
    /** Language of emails and push notifications sent to this user. */
    locale: localeSchema,
    role: roleSchema,
    createdAt: zDateTime,
  })
  .meta({ id: 'User' });
export type User = z.output<typeof userSchema>;

/**
 * Password rules live in one place: the register form, the reset form and the
 * server all validate with this schema.
 */
export const passwordSchema = z
  .string()
  .min(limits.password.min)
  .max(limits.password.max)
  .regex(/[A-Za-z]/, ValidationMessage.PASSWORD_LETTER)
  .regex(/\d/, ValidationMessage.PASSWORD_DIGIT);

export const loginSchema = z.object({
  email: zEmail,
  password: z.string().min(1, ValidationMessage.REQUIRED),
  /** The app's current language; the server stores it as the user's locale. */
  locale: localeSchema.optional(),
});
export type LoginInput = z.input<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(limits.userName.min).max(limits.userName.max),
  email: zEmail,
  password: passwordSchema,
  locale: localeSchema.optional(),
});
export type RegisterInput = z.input<typeof registerSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  /** Seconds until the access token expires. */
  expiresIn: z.number(),
});
export type AuthTokens = z.output<typeof authTokensSchema>;

/** `tokens` is absent in cookie mode: the browser holds them in httpOnly cookies. */
export const authSessionSchema = z.object({
  user: userSchema,
  tokens: authTokensSchema.optional(),
});
export type AuthSession = z.output<typeof authSessionSchema>;

export const refreshResultSchema = z.object({ tokens: authTokensSchema.optional() });
export type RefreshResult = z.output<typeof refreshResultSchema>;

/** `refreshToken` is omitted in cookie mode; the API reads the refresh cookie instead. */
export const refreshSchema = z.object({ refreshToken: z.string().min(1).optional() });

export const updateMeSchema = z.object({
  name: z.string().trim().min(limits.userName.min).max(limits.userName.max).optional(),
  locale: localeSchema.optional(),
});
export type UpdateMeInput = z.input<typeof updateMeSchema>;

/** One signed-in device. `id` is the refresh-token id. */
export const sessionSchema = z.object({
  id: z.string(),
  userAgent: z.string().nullable(),
  ip: z.string().nullable(),
  createdAt: zDateTime,
  expiresAt: zDateTime,
});
export type Session = z.output<typeof sessionSchema>;

export const sessionListSchema = z.object({ items: z.array(sessionSchema) });
export type SessionList = z.output<typeof sessionListSchema>;

export const forgotPasswordSchema = z.object({ email: zEmail });
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, ValidationMessage.REQUIRED),
  password: passwordSchema,
});
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({ token: z.string().min(1, ValidationMessage.REQUIRED) });
export type VerifyEmailInput = z.input<typeof verifyEmailSchema>;

export const authRoutes = {
  register: defineRoute({
    method: 'POST',
    path: '/auth/register',
    auth: false,
    body: registerSchema,
    response: authSessionSchema,
  }),
  login: defineRoute({
    method: 'POST',
    path: '/auth/login',
    auth: false,
    body: loginSchema,
    response: authSessionSchema,
  }),
  refresh: defineRoute({
    method: 'POST',
    path: '/auth/refresh',
    auth: false,
    body: refreshSchema,
    response: refreshResultSchema,
  }),
  // Public on purpose: the refresh token *is* the credential. Requiring a valid
  // access token here would let an expired token keep a live refresh token alive.
  logout: defineRoute({
    method: 'POST',
    path: '/auth/logout',
    auth: false,
    body: refreshSchema,
    response: okResponseSchema,
  }),
  logoutAll: defineRoute({
    method: 'POST',
    path: '/auth/logout-all',
    response: okResponseSchema,
  }),
  sessions: defineRoute({
    method: 'GET',
    path: '/auth/sessions',
    response: sessionListSchema,
  }),
  revokeSession: defineRoute({
    method: 'DELETE',
    path: '/auth/sessions/:id',
    response: okResponseSchema,
  }),
  forgotPassword: defineRoute({
    method: 'POST',
    path: '/auth/password/forgot',
    auth: false,
    body: forgotPasswordSchema,
    response: okResponseSchema,
  }),
  resetPassword: defineRoute({
    method: 'POST',
    path: '/auth/password/reset',
    auth: false,
    body: resetPasswordSchema,
    response: okResponseSchema,
  }),
  verifyEmail: defineRoute({
    method: 'POST',
    path: '/auth/email/verify',
    auth: false,
    body: verifyEmailSchema,
    response: okResponseSchema,
  }),
  /**
   * Public and always successful: someone who cannot log in because the address is not
   * confirmed has no access token yet, and the response must not reveal whether the
   * address exists.
   */
  resendVerification: defineRoute({
    method: 'POST',
    path: '/auth/email/resend',
    auth: false,
    body: forgotPasswordSchema,
    response: okResponseSchema,
  }),
  me: defineRoute({
    method: 'GET',
    path: '/auth/me',
    response: userSchema,
  }),
  updateMe: defineRoute({
    method: 'PATCH',
    path: '/auth/me',
    body: updateMeSchema,
    response: userSchema,
  }),
};
