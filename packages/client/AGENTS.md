# @repo/client: frontend logic shared by web and mobile

Consumed as TypeScript source by Next.js (`transpilePackages`) and Metro. **Everything here must
run in a browser and in React Native.**

## Layout

```
src/
  http/client.ts           configureClient({ apiUrl, auth, onSessionExpired }), request(route, input)
  http/api-error.ts        ApiError, toApiError
  session/                 useAuthStore (status + user), token-storage (bearer mode),
                           startSession / restoreSession / endSession
  preferences/             usePreferencesStore (locale, theme), loadPreferences(storage)
  i18n/i18n.ts             createAppI18n(): i18next + zod error map, follows the locale
  query/query-client.ts    createQueryClient({ onError }): retry rules, silent meta
  form/use-zod-form.ts     useZodForm(schema), setServerErrors(form, error)
  socket/socket.ts         useRealtimeConnection, useSocketEvent
  date/date.ts             dayjs + formatDate / formatDateTime / fromNow (locale-aware)
  features/<feature>/      <feature>.queries.ts (keys, queryOptions, hooks) or <feature>.api.ts
  index.ts                 the only entry point
```

## Rules

- **Platform-neutral.** No `next/*`, `react-native`, `expo-*`, `window`/`document`, UI components.
  Platform pieces are injected: auth mode and token storage (`configureClient`), preference
  storage (`loadPreferences`), error toast (`createQueryClient({ onError })`).
- **All HTTP through `request(contract.x.y, { params, body, query })`.** Types come from the route.
- **Auth modes:** `{ mode: 'cookie' }` (web, httpOnly cookies, `withCredentials`) or
  `{ mode: 'bearer', tokenStorage }` (mobile). Token refresh is automatic and single-flight; on
  failure `endSession()` runs and `onSessionExpired` is called.
- **Session status** is `unknown → signedIn | signedOut`. Wait for `unknown` to resolve before
  redirecting (`restoreSession()` at startup).
- **Query hooks per feature** (copy `features/tasks/tasks.queries.ts`): `xKeys` factory,
  `queryOptions` builders, `useXQuery`, `useVerbXMutation` that writes the returned entity to its
  detail cache and invalidates lists, `useXRealtime()` for socket events.
- Mutations used by forms set `meta: { silent: true }`; the form shows the error through
  `setServerErrors` (field errors on inputs, the rest on `errors.root.server`, all translated).
- Preferences: `useChangeLocale()` updates the store and, when signed in, the user's server locale
  (so email and push follow it).
- `react`, `@tanstack/react-query`, `react-hook-form`, `zod`, `i18next`, `react-i18next` are peer
  dependencies (one instance per app).
- Tests: only logic with behavior (error mapping, `setServerErrors`, session rules).
