# Architecture

## Layers and who may import whom

```
packages/contracts   zod only. Pure, runs everywhere (Node, browser, React Native).
packages/i18n        contracts + i18next. Pure.
packages/theme       no runtime deps. Build script emits web.css / native.css.
packages/client      contracts, i18n, react, react-query, zustand, axios, socket.io-client.
                     NO next/*, react-native, expo-*, DOM globals. Platform pieces are injected.
apps/api             contracts, i18n. Never imported by anything.
apps/web, apps/mobile  client, contracts, i18n, theme. Never import each other.
```

Enforced by `.dependency-cruiser.cjs` (`pnpm lint:deps`): no cycles, no app→app, contracts
pure, client platform-agnostic, features isolated, API modules isolated.

**Feature isolation:** `features/a/**` must not import `features/b/**` (web, mobile, API
modules alike). When two features need the same thing it is not feature code: move it to
`components/` (UI building block), `device/` (mobile capability), `lib/` (pure helper),
`packages/client` (shared logic) or an API `infra/`/`common/` module. In the API, a module that
needs another module's behavior imports that module's exported service through Nest DI
(`TasksModule` imports nothing from `modules/auth` internals; it uses the global `AuthGuard`).

## Where state lives

| Kind of state                     | Owner                                             |
| --------------------------------- | ------------------------------------------------- |
| Server data (tasks, me, sessions) | react-query cache, via hooks in `packages/client` |
| Session status + current user     | `useAuthStore` (`packages/client/src/session`)    |
| User preferences (locale, theme)  | `usePreferencesStore`, persisted per platform     |
| Form values and errors            | react-hook-form via `useZodForm`                  |
| Filters, page, selected id        | the URL (search params / route params)            |
| Purely visual (open, hovered)     | `useState` in the component                       |

Never copy server data into a store or `useState`; read it from the query and derive.

## Session model

- **Web:** cookie mode. The API sets `access_token` (path `/`) and `refresh_token` (path `/auth`)
  as httpOnly, `SameSite=Lax`, `Secure` in production. JavaScript never sees tokens. Requests that
  change state and authenticate by cookie must carry an allowed `Origin` (CSRF guard).
- **Mobile:** bearer mode. Tokens live in the keychain (`expo-secure-store`) and are sent as
  `Authorization: Bearer`.
- The client chooses the mode in `configureClient`. The API guard accepts either. Access tokens
  are short-lived; refresh is single-flight and rotates the refresh token (one use, stored in
  Redis per session). Session expiry ends the session everywhere in the app (`endSession`).
- **Authorization:** roles (`USER`, `ADMIN`) live on the user and in the access token. Every
  permission is declared once with CASL (`apps/api/src/common/authorization/ability.ts`) and
  turned into Prisma `where` clauses, so a list, a read and a write cannot disagree.

## Server topology

One codebase, two processes, horizontally scalable:

- `main.ts` (HTTP + socket.io): validates, authorizes, writes, enqueues, emits realtime events.
- `worker.ts` (BullMQ): emails, reminders, push. Processors are registered only in `WorkerModule`.
- Redis carries sessions, rate limits, socket fan-out and queues, so any node can serve any user.

## Background work

Anything slow, retryable, or scheduled for later goes to a queue: sending mail, sending push,
reminders. Jobs are **idempotent** and **re-check their preconditions when they run** (the
world may have changed since they were queued): the reminder processor reloads the task and
skips it if it was completed, deleted or rescheduled.
