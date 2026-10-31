import * as Sentry from '@sentry/nestjs';

import { loadEnv } from './config/env';

// Imported first by main.ts and worker.ts: Sentry patches modules as they load, so it must init
// before Nest, Express, Prisma or BullMQ are required. Its tracing is OpenTelemetry underneath.
const env = loadEnv();

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    release: env.APP_RELEASE,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
  });
}
