import path from 'node:path';

import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Emits `.next/standalone`, a self-contained server bundle the Dockerfile copies
  // instead of shipping node_modules. `outputFileTracingRoot` must point at the repo
  // root because workspace packages live above `apps/web`.
  output: 'standalone',
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
  // Shared packages ship TypeScript source.
  transpilePackages: ['@repo/client'],
};

// Source maps upload only when SENTRY_AUTH_TOKEN (+ SENTRY_ORG, SENTRY_PROJECT) is set at build time.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
});
