# Monorepo Starter — NestJS + Next.js + Expo

A production-shaped TypeScript monorepo: one typed contract shared by an HTTP/WebSocket API,
a worker, a Next.js web app and an Expo mobile app.

It ships complete auth (register, login, rotating refresh tokens, sessions, password reset,
email verification) and one small reference feature, **tasks** (CRUD, status filter, due-time
push reminders, optional location, realtime sync), implemented on API, web and mobile. Copy its
shape for your own features, or delete it. Every user-facing text exists in English and
Vietnamese. Rules for humans and AI agents: `AGENTS.md` and `docs/agents/`.

```
packages/contracts ──► api      validates requests, serialises responses
                   └─► client   typed request() + react-query hooks ──► web / mobile
api ── Redis ──► socket.io ──► useSocketEvent()
api ── BullMQ ──► worker.ts
```

## What you get

| Area          | Included                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Contract      | Zod schemas + typed routes; one schema validates the form and the request                            |
| Auth          | httpOnly cookies (web) or keychain bearer (mobile), rotating refresh, sessions, reset, verification  |
| Errors        | Domain error codes → HTTP status + `fieldErrors`, translated on every client                         |
| i18n          | `packages/i18n`: one typed dictionary (en, vi) for web, mobile, email and push                       |
| API           | NestJS 12, Prisma 7 / Postgres, Redis, BullMQ worker, throttling, helmet, pino                       |
| Realtime      | socket.io with a Redis adapter, per-user rooms, best-effort delivery                                 |
| Client SDK    | `request(route, input)`, react-query hooks, session + preferences stores, i18n, form helpers         |
| Observability | Structured logs with request ids, Prometheus metrics at `/metrics`, `/health` with dependency probes |
| Web           | Next.js 16 App Router, shadcn (base-maia), shared tokens, auth + tasks + settings screens            |
| Mobile        | Expo 58, React Native Reusables + Uniwind, push, location, EAS release on tag                        |
| Quality       | oxlint (type-aware), oxfmt, dependency-cruiser, knip, cspell, jscpd, sherif, lefthook, commitlint    |

## Requirements

- Node **>= 26.12** (see `engines`), pnpm **12.14** (`packageManager`)
- Docker (Postgres 18 + Redis 8 via `docker-compose.yml`)

## Quickstart

```bash
pnpm install          # also runs `prisma generate` before api tasks
pnpm infra:up         # Postgres :5433, Redis :6380
pnpm db:migrate       # apply migrations
pnpm dev              # contracts watch + api + web + mobile
```

Ports: API `3000`, web `3001`, Metro `8081`.

Open `http://localhost:3001`, create an account and add a task. Emails are logged by the worker
(`pnpm --filter api dev:worker`) in development.

Useful scripts:

```bash
pnpm dev:api                         # api only
pnpm --filter api dev:worker         # the BullMQ worker (build first)
pnpm check
pnpm lint:dead                       # knip: unused files, exports and dependencies
pnpm test:e2e                        # api e2e against the docker infra
pnpm infra:down                      # stop Postgres + Redis
```

## Environment

Each app has a checked-in `.env.example`. Copy it to `.env` and fill in the secrets.

### API (`apps/api/.env`)

| Variable                     | Default                 | Notes                                               |
| ---------------------------- | ----------------------- | --------------------------------------------------- |
| `NODE_ENV`                   | `development`           | `development` \| `test` \| `production`             |
| `PORT`                       | `3000`                  | HTTP + WebSocket                                    |
| `LOG_LEVEL`                  | `info`                  | pino level                                          |
| `CORS_ORIGINS`               | `[]`                    | Comma separated. Allowed for HTTP **and** WebSocket |
| `WEB_APP_URL`                | `http://localhost:3001` | Used to build links in emails                       |
| `DATABASE_URL`               | —                       | Postgres connection string                          |
| `DATABASE_POOL_SIZE`         | `10`                    | Prisma/pg pool size per instance                    |
| `REDIS_URL`                  | —                       | Sessions, throttling, queues, socket adapter        |
| `JWT_ACCESS_SECRET`          | —                       | Min 32 chars                                        |
| `JWT_ACCESS_TTL`             | `900`                   | Seconds                                             |
| `JWT_REFRESH_SECRET`         | —                       | Min 32 chars                                        |
| `JWT_REFRESH_TTL`            | `2592000`               | Seconds (30 days)                                   |
| `REQUIRE_EMAIL_VERIFICATION` | `false`                 | When on, register/login require a verified address  |
| `METRICS_ENABLED`            | `false`                 | Serves `/metrics`; keep it on the scraper network   |
| `WORKER_CONCURRENCY`         | `5`                     | Mail queue concurrency                              |

### Web (`apps/web/.env`)

Nothing is required to serve the welcome screen. When you start calling the API from the web
app, add:

| Variable              | Default                 | Notes                 |
| --------------------- | ----------------------- | --------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Inlined at build time |

### Mobile (`apps/mobile/.env`)

| Variable              | Default                 | Notes                     |
| --------------------- | ----------------------- | ------------------------- |
| `EXPO_PUBLIC_API_URL` | derived from Metro host | Set it for release builds |

## How the pieces connect

### 1. Define the contract first

`packages/contracts` is the source of truth. A route carries its method, path, schemas and
whether it needs a token:

```ts
export const getUser = defineRoute({
  method: 'GET',
  path: '/users/:id',
  response: userSchema,
  // `auth: false` for public routes — everything else requires a bearer token.
});
```

From that single declaration you get, with no hand-written types:

- server-side validation (`@Endpoint(route)` + `@ReqBody()`)
- server-side serialisation (unknown keys are stripped, `Date` becomes an ISO string)
- `request(route, { params, body })` on the client, typed end to end
- `RouteBody<typeof route>` / `RouteResult<typeof route>` in services

### 2. Errors are codes

The API only throws `AppException(ErrorCode.X, { field })`. The filter turns that into an
`ApiErrorBody` (`code`, `message`, `fieldErrors`, `requestId`). Frontends branch on `error.code`
and `setServerErrors(form, error)` maps `fieldErrors` onto the matching inputs. Adding a code
means adding it to `ErrorCode` and `errorStatus` (type enforced) and its message to both
dictionaries in `packages/i18n`. Validation messages are translated from zod issue codes, so the
same schema shows the same localized message in the browser and from the server.

### 3. Auth flow

```
register / login ──► { user, tokens: { accessToken (15m), refreshToken (30d, single use) } }
                     web sends `x-auth-mode: cookie`: tokens go to httpOnly cookies instead
refresh          ──► rotates: the old refresh token is deleted (getdel) before a new pair is issued
logout           ──► revokes the refresh token (no access token required — the token is the credential)
logout-all       ──► revokes every session for the user
password reset   ──► revokes every session for the user
```

Refresh tokens live in Redis (`auth:refresh:<userId>:<jti>`) with a session record per device,
which powers `GET /auth/sessions` and `DELETE /auth/sessions/:id`. An axios interceptor in
`packages/client` refreshes once (single-flight) on `AUTH_TOKEN_EXPIRED` and replays the
original request.

Endpoints: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`,
`/auth/logout-all`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/email/verify`,
`/auth/email/resend`; `GET /auth/me`, `/auth/sessions`; `DELETE /auth/sessions/:id`.

### 4. Realtime

`socket.io` authenticates with the access token, joins `user:<id>`, and the API publishes through
`@socket.io/redis-emitter` — so every replica can reach every socket. Delivery is best effort:
a Redis hiccup logs a warning instead of failing the HTTP request that triggered it.

## Adding a feature

Follow `docs/agents/adding-a-feature.md`; `tasks` is the reference implementation on every layer.

## Project layout

```
apps/api        NestJS: REST + WebSocket (main.ts) and jobs (worker.ts)
apps/web        Next.js App Router: auth, tasks, settings
apps/mobile     Expo Router: auth, tasks, settings, push, location
packages/contracts   Zod schemas, routes, error codes, socket events
packages/i18n        en + vi dictionaries, error/validation translation
packages/client      request(), react-query hooks, auth store, socket, forms
packages/theme       Design tokens → web.css + native.css + rgbColors
packages/{typescript,jest}-config
```

Rules that keep it coherent:

- Reusable logic goes in `packages/client`, tokens in `packages/theme`. Components are not
  shared: web uses shadcn primitives, mobile uses React Native Reusables.
- Versions used by more than one workspace live in the pnpm catalog (`pnpm-workspace.yaml`).
- Generated code is never edited: `apps/api/src/generated/**`, `packages/*/dist/**`,
  `apps/mobile/uniwind-types.d.ts`, `apps/web/next-env.d.ts`.
- `pnpm check` runs every gate: oxfmt, sherif, knip (unused deps/files), dependency-cruiser
  (cycles and layer boundaries), cspell, jscpd, then lint, types, tests and builds. Git hooks
  (lefthook) format and lint staged files and enforce Conventional Commits.

## Testing

```bash
pnpm test         # unit: business rules in contracts, i18n, client, api
pnpm test:e2e     # api e2e against Postgres + Redis
```

The API e2e suite covers the parts that are expensive to get wrong: validation errors, refresh
rotation and reuse detection, logout revocation, the full password-reset flow, email
verification, session listing/revoking, the health payload and authenticated websockets.

Screens are not tested; see `docs/agents/testing.md` for what deserves a test.

## Deploy

Both server apps build from the repo root so Turborepo can prune to only what they need.

```bash
# API (also runs the worker: override the command with `node dist/worker.js`)
docker build -f apps/api/Dockerfile -t api .
docker run --env-file apps/api/.env -p 3000:3000 api

# Web — NEXT_PUBLIC_* is inlined, so pass it at build time once you use the API from the web app
docker build -f apps/web/Dockerfile -t web .
docker run -p 3001:3001 web
```

Migrations are a separate step, run once per release (not per replica):

```bash
pnpm --filter api db:deploy
```

Mobile: push a tag `vX.Y.Z` and `.github/workflows/mobile-release.yml` builds the IPA, AAB and a
preview APK on EAS. One-time setup (app id, credentials, push keys): `docs/agents/mobile-release.md`.

Before going live: set real `JWT_*` secrets, restrict `CORS_ORIGINS`, turn on
`REQUIRE_EMAIL_VERIFICATION`, wire a real mail provider in `apps/api/src/modules/mail`, and put
`/metrics` behind your internal network.

## Observability

- **Logs** — pino JSON with `requestId` (from `x-request-id` or generated), response time and
  status. 5xx are logged with the stack; client errors are not.
- **Health** — `GET /health` probes Postgres and Redis with a 3s timeout and returns `503` when
  a dependency is down. It never hangs, so orchestrators can act on it.
- **Metrics** — `GET /metrics` exposes `http_requests_total` and
  `http_request_duration_seconds{method,route,status}` plus Node process metrics. The `route`
  label is the controller method, not the URL, to keep cardinality bounded.

## CI

`.github/workflows/ci.yml` runs two jobs:

1. `verify`: commitlint (PRs), then `pnpm check` (every gate, lint, types, tests, builds)
2. `e2e`: Postgres + Redis services, `db:deploy`, then the API e2e suite

`.github/workflows/mobile-release.yml` builds the mobile apps on release tags.

Both must be green before merging.
