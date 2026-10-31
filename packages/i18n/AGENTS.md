# @repo/i18n: every user-facing string

Web, mobile and the API (emails, push) all render text through this package. **No user-facing
string is written anywhere else.** Code, logs, comments and identifiers stay English.

## Layout

- `src/locales/en/<namespace>.ts`: the **source** dictionary, one file per namespace (`common`,
  `errors`, `validation`, `email`, one per feature). Register a new namespace in `locales/en/index.ts`.
- `src/locales/vi/index.ts`: typed as `Dictionary<typeof en>`, so a missing or extra key fails
  the type-check. The spec also asserts identical key sets.
- `src/messages.ts`: `translateError` (by `ErrorCode`), `translateFieldError` (API field errors and
  local zod issues), `zodErrorMap` (install on the frontend so built-in zod messages are localized).

## Rules

- Add a key to `en` first, then to `vi` in the same change. Keys are camelCase and grouped by screen
  or concept (`tasks.fields.dueAt`), never by component name.
- `errors` keys are exactly the `ErrorCode` values (enforced with `satisfies`). New error code →
  add it to the contract and to both dictionaries.
- Schemas never carry text. A custom zod message is a `ValidationMessage` key from the contract.
- Interpolate with `{{name}}`; never concatenate translated fragments (word order differs).
- Dates and numbers are formatted with the locale (`formatDate` in `@repo/client`), not in strings.
