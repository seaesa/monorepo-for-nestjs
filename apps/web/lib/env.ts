import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * The only place the web app reads `process.env`. Next inlines `NEXT_PUBLIC_*` at build time,
 * so a production build without them fails here instead of shipping a bundle that calls localhost.
 */
export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_URL: isProduction ? z.url() : z.url().default('http://localhost:3000'),
    /** Unset = Sentry stays off. Public by design: a DSN only allows sending events. */
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
    /** Separates staging from production; both are production builds. */
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().default('development'),
    /** Share of page loads and requests traced, 0–1. */
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  },
  emptyStringAsUndefined: true,
});
