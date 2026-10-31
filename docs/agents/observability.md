# Observability

Three signals, each with one owner. All are off or quiet by default, so local development and
tests need no account; production turns them on with env only.

| Signal  | Tool                                                | Where it is wired                                                                       |
| ------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Logs    | pino (`nestjs-pino`), JSON in production            | `apps/api/src/infra/logger.ts`                                                          |
| Errors  | Sentry (`@sentry/nestjs`, `nextjs`, `react-native`) | `apps/api/src/instrument.ts`, `apps/web/lib/sentry.ts`, `apps/mobile/src/lib/sentry.ts` |
| Traces  | Sentry tracing (OpenTelemetry underneath)           | same files; `*_TRACES_SAMPLE_RATE`                                                      |
| Metrics | Prometheus `/metrics`                               | `apps/api/src/infra/metrics`, `METRICS_ENABLED`                                         |

Sentry's Node SDK is built on OpenTelemetry, so the API does not set up a second OTel SDK: that
would double-patch modules. To export traces to another backend, add an OTel exporter to the
Sentry setup instead of a parallel `NodeSDK`.

## Rules

- **What gets reported:** only failures that are bugs. `AllExceptionsFilter` sends 5xx to Sentry;
  4xx (`AppException` with a client code) are expected outcomes and are never reported. Don't call
  `captureException` for validation, not-found or auth failures.
- **Never send personal data or secrets:** no tokens, passwords, emails or request bodies in logs,
  Sentry tags or breadcrumbs. Identify users by id only.
- **Correlate with ids:** each request log has `reqId` and `userId`; the API's error body returns
  `requestId`, and Sentry events carry it as a tag. Search Sentry by the id a user reports.
- **Releases:** set `APP_RELEASE` (API) to the image tag or git sha. Web and mobile upload source
  maps at build time when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` are set (CI or
  EAS secrets); without them the build still succeeds, stack traces are just minified.
- **Sampling:** traces cost quota. Start production at `0.05`–`0.1` and raise only for a
  specific investigation.
- **Environments:** `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` separate staging from
  production (both build with `NODE_ENV=production`). Mobile uses its variant.
