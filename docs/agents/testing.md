# Testing

Tests exist to protect **business behavior**. Every test must answer: _which user-visible rule
breaks if this fails?_ If there is no good answer, don't write the test.

## Write a test for

- Business rules and policies: `task-reminder.policy.spec.ts` (when a reminder fires).
- Authorization: the permission table (`ability.spec.ts`) and that another user's task is not
  found (`tasks.service.spec.ts`).
- State transitions and their side effects: completing a task cancels its reminder.
- Security-sensitive flows: token rotation and reuse, session revocation, CSRF on cookie auth.
- Error mapping that the frontend depends on: `all-exceptions.filter.spec.ts`,
  `set-server-errors.spec.ts`.
- Translation completeness: every error code and validation key exists in every locale.
- Date/time and money arithmetic, parsing, anything with edge cases.

## Don't write tests for

- Screens, components, layouts, styles, snapshots.
- Framework wiring (that a controller calls a service, that a module imports a module).
- Getters, mappers with no logic, constants, generated code.
- Library behavior (zod, react-query, Prisma).

## How

- **Unit** (`*.spec.ts` next to the file, Jest): construct the class/function directly with plain
  `jest.fn()` mocks; no Nest testing module unless DI itself is under test. Prefer extracting
  the rule into a pure function and testing that.
- **E2E** (`apps/api/test/app.e2e-spec.ts`): real Postgres + Redis. Per new route: the happy path
  and its main error code. Use the `signUp(label)` helper; each test creates its own users.
- Name tests as behavior, in the domain's words:
  `it('does not remind about a task that is already done')`, not `it('returns null')`.
- One behavior per test; arrange with the minimum data; assert on outcomes, not on calls,
  unless the call _is_ the outcome (a job was cancelled).
- Time: pass `now` into the rule instead of mocking the clock.
