# AGENTS.md

Full-stack TypeScript monorepo: an API + background worker, a web app and a mobile app, sharing
one typed contract, one dictionary, one set of design tokens and one frontend data layer.

**Before writing code:** read this file, then the `AGENTS.md` of every package you will touch,
then the topic guide in `docs/agents/` that matches the task. They are short on purpose. The
rules in them are enforced by tooling (`pnpm check`); breaking one fails CI.

## The product in one paragraph

A user signs up (email + password, verified by email), signs in on the web (session in httpOnly
cookies) or on mobile (tokens in the device keychain), and manages **tasks**: title, optional
description, status `TODO → IN_PROGRESS → DONE`, optional due time and optional location. When a
due time arrives and the task is not done, the owner gets a push notification on every signed-in
phone. Changes made on one device appear on the others in real time. Every text the user reads
is available in English and Vietnamese and follows the user's chosen language, including email
and push. `tasks` is the **reference feature**: copy its shape when you build a new one.

## Map

| Path                 | Responsibility                                                                  | Rules                          |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------ |
| `packages/contracts` | **Source of truth** for the API: schemas, routes, error codes, realtime events. | `packages/contracts/AGENTS.md` |
| `packages/i18n`      | Every user-facing string (UI, errors, validation, email, push), `en` + `vi`.    | `packages/i18n/AGENTS.md`      |
| `packages/client`    | Frontend logic shared by web + mobile: HTTP, session, queries, forms, prefs.    | `packages/client/AGENTS.md`    |
| `packages/theme`     | Design tokens (colors, radius, fonts) compiled for web and mobile.              | `packages/theme/AGENTS.md`     |
| `apps/api`           | HTTP + realtime server (`main.ts`) and job worker (`worker.ts`), one codebase.  | `apps/api/AGENTS.md`           |
| `apps/web`           | Web app.                                                                        | `apps/web/AGENTS.md`           |
| `apps/mobile`        | iOS + Android app.                                                              | `apps/mobile/AGENTS.md`        |
| `docs/agents/`       | Topic guides: architecture, conventions, errors, testing, performance, release. | read the one you need          |

## How a request flows

```
contracts ─► api     validates input with the route schema, serializes output with it,
                     throws AppException(ErrorCode.X) for every business failure
          └► client  request(route, input) + useXQuery / useXMutation ─► web and mobile screens
                     ApiError{code, fieldErrors} ─► setServerErrors(form) ─► translated inline errors
api ─ RealtimeService.toUser ─► Redis ─► socket.io ─► useXRealtime() updates the query cache
api ─ queue.add(job) ─► Redis/BullMQ ─► worker processors (email, reminders, push)
```

## Golden rules

1. **Contract first.** A change to what the API accepts or returns starts in `packages/contracts`.
   Apps never declare request/response types by hand; they import them.
2. **Validate once.** The schema that validates the API body is the schema the form uses. Never
   write a second set of rules on a frontend.
3. **Errors are codes, text is i18n.** The API throws `AppException(ErrorCode.X)`. Frontends
   branch on `error.code`, never on `message` or HTTP status. A new code needs its status in
   `errorStatus` and its message in both dictionaries.
4. **No user-facing string outside `packages/i18n`.** Not in components, not in schemas, not in
   emails or pushes. Code, identifiers, logs, comments and commit messages are English.
5. **Share logic, not components.** Anything both apps need that is not UI (API calls, query keys,
   stores, formatting, validation) lives in `packages/client`. UI components are per platform
   (`apps/web/components/ui`, `apps/mobile/src/components/ui`) with the same names, variants and
   tokens, so screens read alike. Colors and radius only come from `packages/theme`.
6. **Access is decided in one place.** Who may do what to which record lives in
   `apps/api/src/common/authorization/ability.ts` (CASL). Queries on user data filter with
   `accessibleBy(defineAbilityFor(actor), action).ofType('Model')`, never with hand-written owner
   checks. A record the actor may not see is "not found", not "forbidden".
7. **Boundaries are enforced.** Features don't import other features; packages don't import apps;
   `contracts` imports only zod; `client` imports nothing platform-specific. See
   `docs/agents/architecture.md`.
8. **Generated code is never edited:** `apps/api/src/generated/**`, `packages/*/dist/**`,
   `apps/mobile/uniwind-types.d.ts`, `apps/web/next-env.d.ts`, Prisma migrations once committed.
9. **Versions live in the pnpm catalog** (`pnpm-workspace.yaml`) when more than one workspace uses
   a package (`"pkg": "catalog:"`). Mobile native packages: `npx expo install <pkg>` in `apps/mobile`.
10. **Nothing hard-coded, nothing scattered.** Env is read in one file per app and validated;
    numbers and keys have one named home. See `docs/agents/config-and-constants.md`.
11. **Leave it smaller.** No speculative options, wrappers or abstractions. Delete what your change
    made unused. Don't reformat or "improve" code you weren't asked to touch.

## Before you write: decide where it goes

Answer these in order; the first "yes" is the home. Details and examples:
`docs/agents/conventions.md`.

1. Does it change what the API accepts/returns, or add an error/event? → `packages/contracts`.
2. Is it text a user reads? → `packages/i18n` (`en` first, then `vi`).
3. Is it a color, radius or font? → `packages/theme`.
4. Is it frontend logic both apps can use (no DOM, no native module)? → `packages/client`.
5. Is it one feature's UI? → `apps/<app>/…/features/<feature>/components/`.
6. Is it a device capability used by several features (push, location)? → `apps/mobile/src/device/`.
7. Is it an app-wide UI building block (form field, screen shell)? → `apps/<app>/…/components/`.
8. Is it a route? → `apps/web/app/` or `apps/mobile/src/app/`, kept thin: compose feature components.

## Code you write

- **Names:** English, intention-revealing, kebab-case files, named exports. Hooks are `useX`
  named for what they return or do (`useCurrentLocation`, `useTasksRealtime`), not how.
  Full rules: `docs/agents/conventions.md`.
- **Comments:** only for the _why_ that the code can't say: a business rule, a non-obvious
  constraint, a workaround with its reason. Never narrate what the next line does.
- **Tests:** only business logic whose failure would hurt users or data: rules, policies,
  permissions, state transitions, money/time math, error mapping. No screen or snapshot tests,
  no tests of framework glue. See `docs/agents/testing.md`.
- **Performance:** paginate lists, index what you filter on, never query in a loop, keep server
  data in react-query (not in stores), virtualize long lists. See `docs/agents/performance.md`.

## Commands (repo root)

```bash
pnpm install                 # also generates the Prisma client
pnpm infra:up                # Postgres :5433 + Redis :6380 (docker compose)
pnpm db:migrate              # apply/create migrations (dev)
pnpm dev                     # contracts/i18n watch, api, web, mobile
pnpm --filter api dev:worker # the worker (run `pnpm --filter api build` first)
pnpm format                  # oxfmt
pnpm check                   # EVERY gate: format, deps, dead code, boundaries, spelling,
                             # duplication, lint, types, unit tests, builds
pnpm test:e2e                # API end-to-end against the docker infra
```

Ports: API `3000`, web `3001`, Metro `8081`. Env templates: `apps/*/.env.example`.

## Definition of done

1. `pnpm check` passes (and `pnpm test:e2e` when the API changed).
2. New behavior that encodes a business rule has a unit test; a new route has an e2e happy path
   and its main error code.
3. Both locales have every new key; both apps still build.
4. The `AGENTS.md` / `docs/agents/*` you relied on still tell the truth; update them in the same
   change if not.
5. Commits follow Conventional Commits; the scope, when given, is a workspace (`feat(api): …`,
   `fix(mobile): …`; list in `commitlint.config.ts`). Enforced by commitlint.
6. A decision that is expensive to reverse (library, boundary, security or data model) gets an
   ADR in `docs/adr/`. Read the existing ADRs before proposing to undo one.

## Topic guides

- `docs/agents/architecture.md`: layers, boundaries, data ownership, session model.
- `docs/agents/adding-a-feature.md`: the end-to-end checklist, modeled on `tasks`.
- `docs/agents/conventions.md`: naming, placement, comments, exports, state.
- `docs/agents/config-and-constants.md`: where env, limits, tunables and keys live.
- `docs/agents/errors-and-i18n.md`: error codes, validation messages, translation flow.
- `docs/agents/testing.md`: what deserves a test and how to write it.
- `docs/agents/observability.md`: logs, Sentry errors and traces, metrics, what to report.
- `docs/agents/performance.md`: database, API, query cache, rendering.
- `docs/agents/quality-gates.md`: the tools behind `pnpm check`, git hooks, commits.
- `docs/agents/mobile-release.md`: app identity, EAS builds, push setup, releases.
- `docs/adr/`: why the big decisions were made (contract, sessions, authorization, tooling, errors).
