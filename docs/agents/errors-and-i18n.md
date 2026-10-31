# Errors, validation and translation

## The error contract

Every API failure has the same body (`ApiErrorBody` in `packages/contracts/src/errors.ts`):

```json
{ "code": "TASK_NOT_FOUND", "message": "…", "status": 404, "requestId": "…", "fieldErrors": [] }
```

- `code` is the only thing a frontend may branch on. `message` is an English fallback for logs.
- `fieldErrors[]` = `{ field, code, params? }` binds a failure to a form input.
- `NETWORK_ERROR` is produced by the client only (no response reached it).

## Adding an error code

1. `ErrorCode.X` + its HTTP status in `errorStatus` (`packages/contracts/src/errors.ts`). The type
   won't compile without both.
2. Its message in `packages/i18n/src/locales/en/errors.ts` and the `vi` dictionary (enforced).
3. API: `throw new AppException(ErrorCode.X)`; to point at an input, `{ field: 'email' }`.
4. Frontend: usually nothing. `setServerErrors` / the global toast translate it. Branch on
   `error.code` only when the UI must _behave_ differently (redirect, offer resend).

Choose codes for what the **user** can act on. Reuse the generic ones (`VALIDATION_FAILED`,
`NOT_FOUND`, `FORBIDDEN`, `CONFLICT`) unless a screen needs to tell the cases apart.

## Who turns what into an error

| Source                    | Becomes                                                 | Where                 |
| ------------------------- | ------------------------------------------------------- | --------------------- |
| `AppException(code)`      | that code + `errorStatus[code]`                         | `AllExceptionsFilter` |
| zod failure on body/query | `VALIDATION_FAILED` + `fieldErrors`                     | `@Endpoint` + filter  |
| Prisma unique / not found | `CONFLICT` / `NOT_FOUND`                                | filter                |
| rate limit                | `RATE_LIMITED`                                          | filter                |
| anything else             | `INTERNAL_ERROR`, logged with requestId, message hidden | filter                |

## Validation messages

Schemas carry no text. Built-in zod issues are translated from their issue code and params
(`too_small` + `minimum: 8` → "Must be at least 8 characters"). A rule zod can't describe gets a
`ValidationMessage` key (`.regex(/\d/, ValidationMessage.PASSWORD_DIGIT)`), translated by
`packages/i18n`. The same schema produces the same translated message whether it failed in the
browser or on the server.

## Translation flow

- Frontends: `createAppI18n()` (from `@repo/client`) builds the i18next instance, installs the
  zod error map and follows `usePreferencesStore().locale`. Components use
  `useTranslation('<namespace>')`.
- Server: `translator(locale, namespace)` in `apps/api/src/infra/i18n`. Email and push use the
  recipient's stored `User.locale` (synced when the user changes language or signs in).
- Never concatenate translated fragments; interpolate (`{{title}}`). Format dates and numbers with
  the locale-aware helpers (`formatDateTime`, `fromNow`).
