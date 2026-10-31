import { z } from 'zod';

const csv = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);

/** `"false"` is truthy for `z.coerce.boolean()`, so booleans get an explicit parser. */
const booleanish = z
  .union([z.boolean(), z.string()])
  .default('false')
  .transform((value) => value === true || value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGINS: csv.default([]),
  /** Public origin of the web app — used to build links in emails. Required in production. */
  WEB_APP_URL: z.url().default('http://localhost:3001'),
  /** Set when web and API live on sibling subdomains (`.example.com`); unset = host-only. */
  /** Serves /docs and /openapi.json. Unset = on everywhere except production. */
  API_DOCS_ENABLED: z.stringbool().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  /** Expo push access token; required only when "Enhanced push security" is on in Expo. */
  EXPO_ACCESS_TOKEN: z.string().optional(),

  DATABASE_URL: z.url(),
  /** Connections per process; see PrismaService. */
  DATABASE_POOL_SIZE: z.coerce.number().int().positive().default(10),
  REDIS_URL: z.url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_TTL: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),

  /** Reject logins until the address is confirmed. Off by default so local dev needs no mailer. */
  REQUIRE_EMAIL_VERIFICATION: booleanish,
  /** Exposes /metrics for scraping. Disable when the collector is not deployed yet. */
  METRICS_ENABLED: booleanish,
  /** Error reporting and tracing; unset = Sentry stays off (local dev, tests). */
  SENTRY_DSN: z.url().optional(),
  /** Separates staging from production in Sentry; both run with NODE_ENV=production. */
  SENTRY_ENVIRONMENT: z.string().default('development'),
  /** Share of requests traced, 0–1. Traces cost quota: start low in production. */
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  /** Deployed version (image tag or git sha); ties errors to a release. */
  APP_RELEASE: z.string().optional(),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
});

export type Env = z.output<typeof envSchema>;

/** Defaults that only make sense on a laptop: production must set them, so a deploy never points at localhost. */
const REQUIRED_IN_PRODUCTION = ['WEB_APP_URL'] as const;

export function validateEnv(raw: Record<string, unknown>): Env {
  if (raw.NODE_ENV === 'production') {
    const missing = REQUIRED_IN_PRODUCTION.filter((key) => !raw[key]);
    if (missing.length > 0) throw new Error(`Missing production env: ${missing.join(', ')}`);
  }
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** For code that runs before Nest boots (`instrument.ts`); everything else injects `AppConfig`. */
export function loadEnv(): Env {
  return validateEnv(process.env);
}
