import * as Sentry from '@sentry/nextjs';

import { env } from './env';

/** Same options in the browser, on the server and at the edge; a no-op without a DSN. */
export function initSentry(): void {
  if (!env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    tracesSampleRate: env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  });
}
