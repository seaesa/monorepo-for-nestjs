# @repo/contracts — the API contract

**Every app depends on this package. A change here is a change to the public API.** Be deliberate.

## What lives here

- `src/route.ts` — `defineRoute`, `RouteDef` and the derived types (`RouteInput`, `RouteBody`, `RouteQuery`, `RouteResult`, `RouteResponse`), `buildPath`.
- `src/errors.ts` — `ErrorCode`, `errorStatus`, `apiErrorBodySchema`/`ApiErrorBody`, `FieldError`, `issueParams`.
- `src/validation.ts` — `ValidationMessage` keys for custom schema messages.
- `src/common.ts` — shared zod building blocks: `zId`, `zEmail`, `zDateTime`, pagination.
- `src/modules/<feature>.ts` — schemas + routes per feature. `src/index.ts` exports all and assembles `contract`.
- `src/socket.ts` — `ServerToClientEvents`, `ClientToServerEvents`, room naming.

## Rules

- **Pure and isomorphic.** Only `zod` as a dependency. No Node, DOM, React, Nest or Prisma imports — it runs in the API, the browser and React Native.
- One file per feature. A route is `defineRoute({ method, path, body?, query?, response, auth? })`. `auth` defaults to `true`; public routes say `auth: false`.
- Paths are absolute and Express-style (`/users/:id`). Path params are strings and validated server-side (`ParseIdPipe`).
- Schemas describe the **wire format**: dates are ISO strings via `zDateTime` (accepts `Date` on the server so Prisma rows serialize directly). Never expose internal fields (`passwordHash`, `userId` of others) — the response schema is the allow-list.
- The contract is also the published API reference (`/docs` on the API). Give main read models an
  id with `.meta({ id: 'Task' })` so they appear as named schemas.
- Normalize in the schema (`zEmail` trims + lower-cases) so the form and the API agree.
- Schemas carry no user-facing text. A custom message is a `ValidationMessage` key; `packages/i18n` translates it.
- Export `type X = z.output<typeof xSchema>` for read models and `type XInput = z.input<...>` for form/request inputs.
- For numbers in query strings use `z.coerce.number<number>()` so the input type stays `number`.
- **Error codes:** add to `ErrorCode` **and** `errorStatus` (the type enforces it), then add the message to `packages/i18n/src/locales/{en,vi}/errors.ts`. Never rename or delete a code without updating both frontends.
- Breaking changes (renaming a field, tightening validation, removing a route) require updating API, web and mobile in the same change. Mobile builds in the wild keep calling old shapes — prefer additive changes.

- Length, size and page limits shared by the API and forms live in `src/limits.ts`. Schemas
  reference them; never type the number in a schema or a form.

## Build

Compiled to CommonJS + `.d.ts` in `dist/` with `tsc` (the API requires it at runtime). `pnpm dev` runs `tsc --watch`; turbo builds it before anything that depends on it. Imports inside `src` are extensionless (CJS resolution).
