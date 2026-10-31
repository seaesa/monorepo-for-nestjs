# Adding a feature end to end

`tasks` is the reference. Open its files side by side and keep the same shapes and names.

## 1. Contract: `packages/contracts/src/modules/<feature>.ts`

- Read model schema (`taskSchema`): the wire format and the **allow-list** of what is exposed.
- Input schemas: `create…Schema` (defaults applied here), `update…Schema` (`.partial()`, where
  `null` clears and an omitted field is left untouched), `list…QuerySchema` (pagination + filters).
- Routes with `defineRoute` in a `<feature>Routes` object; register it in `src/index.ts`.
- New business failure → `ErrorCode.X` + `errorStatus`; new realtime event → `src/socket.ts`.
- Export types: `type X = z.output<…>`, `type XInput = z.input<…>`.

## 2. Text: `packages/i18n`

- `locales/en/<feature>.ts` (register in `locales/en/index.ts`), then the `vi` block.
- New error codes in both `errors` dictionaries.

## 3. API: `apps/api`

1. Prisma model (owner relation + index on what lists filter/sort by), then
   `pnpm db:migrate --name <change>`; commit the migration.
2. `src/modules/<feature>/`: `<feature>.module.ts`, `.controller.ts` (`@Endpoint(route)` only),
   `.service.ts` (takes the `actor`, filters through the ability in `common/authorization`; maps rows to the contract shape).
3. Pure business rules in their own file (`task-reminder.policy.ts`) so they test without mocks.
4. Side effects after a write: realtime (`RealtimeService.toUser`) and queues.
5. Import the module in `app.module.ts` (processors in `worker.module.ts`).
6. Tests: unit test the service rules and policies; e2e the happy path + main error code.

## 4. Shared client: `packages/client/src/features/<feature>/<feature>.queries.ts`

- `xKeys` factory, `xQuery`/`xsQuery` with `queryOptions`, `useXQuery` wrappers.
- Mutations: `meta: { silent: true }` when a form shows the error; update the detail cache with
  the response and invalidate lists.
- `useXRealtime()` when the feature emits events. Export from `src/index.ts`.

## 5. Screens

- Web: `apps/web/features/<feature>/components/*` + thin routes in `apps/web/app/(app)/…`.
- Mobile: `apps/mobile/src/features/<feature>/components/*` + thin routes in `src/app/(app)/…`.
- Same component names on both platforms (`TaskList`, `TaskCreateForm`), same hooks, same
  i18n keys. Forms: `useZodForm(contractSchema)` + `setServerErrors(form, error)`.

## 6. Finish

`pnpm check`, `pnpm test:e2e`, and update the docs you relied on if they changed.
