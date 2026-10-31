# Config and constants

Every value that could change belongs to exactly one home. If you are about to type a number,
URL, key or name a second time, find its home instead. `oxlint` enforces the two mechanical
parts: `node/no-process-env` (env is read in one file per app) and `no-magic-numbers`.

## Where a value lives

| The value is…                                                        | Home                                                     | Example                                |
| -------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------- |
| Different per environment, or a secret                               | env, declared in the app's `env.ts` + `.env.example`     | `DATABASE_URL`, `NEXT_PUBLIC_API_URL`  |
| A business rule both the API and a form enforce                      | `packages/contracts/src/limits.ts`                       | `limits.taskTitle.max`                 |
| A technical tunable of one app (rate limit, cache time, timeout)     | that app's config module, as a named constant            | `rateLimits.login`, `STALE_TIME_MS`    |
| A tunable ops must change without a deploy                           | promote it to env                                        | `JWT_ACCESS_TTL`                       |
| A name or key shared by producer and consumer (cookie, queue, event) | next to the code that owns it, exported once             | `ACCESS_COOKIE`, `QueueName.REMINDERS` |
| A value used in one function only                                    | a `const` at the top of that file, named for its meaning | `ONE_SHOT_TOKEN_BYTES`                 |
| A color, radius or font                                              | `packages/theme/src/tokens.ts`                           | `primary`                              |
| A user-facing string                                                 | `packages/i18n`                                          | `tasks.empty`                          |

## Env rules

- **One reader per app.** API: `apps/api/src/config/env.ts` (zod; inject `AppConfig`). Web:
  `apps/web/lib/env.ts` (`@t3-oss/env-nextjs`). Mobile runtime: `apps/mobile/src/lib/env.ts`
  (`@t3-oss/env-core`, `EXPO_PUBLIC_*`); mobile build time: `apps/mobile/app.config.ts`. Prisma CLI:
  `apps/api/prisma.config.ts`. Nothing else touches `process.env`.
- **Fail fast, never silently.** Env is parsed at startup or build; a missing or malformed value
  stops the app. Defaults exist only for local development (a localhost URL, a dev port). In
  production, URLs and secrets are required — a forgotten variable must crash the deploy, not
  quietly point at `localhost`.
- **Client env is public.** Anything prefixed `NEXT_PUBLIC_` / `EXPO_PUBLIC_` ships inside the
  bundle. Never put a secret there.
- **Declare it everywhere it travels.** A new variable goes into `env.ts`, `.env.example`, and,
  when a Turbo task needs it, the task's `env` list in `turbo.json` (strict env mode drops the
  rest). Build-time web variables also need an `ARG` in `apps/web/Dockerfile`; mobile ones are EAS
  environment variables (`docs/agents/mobile-release.md`).

## Constant rules

- Name the meaning, not the value: `MAX_RETRIES = 2`, not `TWO`. Include the unit in the name
  when there is one: `_MS`, `_SECONDS`, `_BYTES`.
- Derive instead of repeating: `perMinute(rateLimits.login)`, `SECONDS_PER_DAY`, `limits.x.max`.
  Use `HttpStatus.*` from Nest instead of status numbers.
- Don't create a global `constants.ts` dumping ground. A constant lives with its owner and is
  exported only when a second module needs it.
- Allowed literals: `-1, 0, 1, 2`, array indexes, default parameter values, enums, tests, and
  `components/ui` (vendored kits). Anything else needs a name, or an
  `oxlint-disable-next-line no-magic-numbers -- <reason>` when the number is the domain (e.g.
  histogram buckets, color math).
