<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# apps/web: Next.js (App Router)

Read the root `AGENTS.md` first. Data layer: `packages/client/AGENTS.md`. Tokens:
`packages/theme/AGENTS.md`.

## Layout

```
app/                      routes only; thin: read params, compose feature components
  (auth)/                 signed-out pages (login, register, forgot/reset password)
  (app)/                  signed-in pages (tasks, settings) + header
  verify-email/           reachable signed in or out (email link)
components/
  ui/                     shadcn components (generated, style base-maia); edit, keep structure
  form/                   TextField, FormError: react-hook-form bindings for ui/
  providers.tsx           configureClient (cookie mode), query client, i18n, theme, session
features/<feature>/components/   feature UI ('use client' where interactive)
lib/                      env.ts (t3 env: the only process.env reader), cookies.ts, locale.ts (server-only), utils.ts (cn)
```

## Rules

- **Session:** cookie mode. The API sets httpOnly cookies; this app never touches tokens.
  `SessionGate` in the `(auth)`/`(app)` layouts redirects by session status. Server components
  don't call the authenticated API; data is fetched on the client through `@repo/client` hooks.
- **Data:** only hooks from `@repo/client`. No `fetch`/axios in components, no query keys here.
- **Forms:** `useZodForm(contractSchema)`, `<TextField form name label />`, `<FormError form />`,
  submit with `m.mutate(values, { onError: (e) => setServerErrors(form, e) })`.
- **Text:** `useTranslation('<namespace>')`. The locale comes from the `locale` cookie (server
  render) and `usePreferencesStore` (client); changing it rewrites the cookie and refreshes.
- **URL state:** filters and pagination live in search params (`/tasks?status=DONE`), parsed with
  the contract schema (`taskStatusSchema.safeParse`).
- **UI:** add primitives with `pnpm --filter web ui:add <name>`; never hand-write one shadcn has.
  Base UI is strict about context (e.g. `Menu.GroupLabel` inside `Menu.Group`). Use token classes
  (`bg-background`, `text-muted-foreground`); never raw colors or new tokens here.
- **Theme:** `next-themes` (`ThemeProvider`); the shared preferences `theme` is used by mobile.
- **Typed routes:** `PageProps<'/route'>` needs `next typegen` (run by `check-types`).
- **Env:** only `NEXT_PUBLIC_*` reaches the browser; declare it in `lib/env.ts`, `.env.example` and the Dockerfile `ARG`; required in production.

## Done

`pnpm lint && pnpm --filter web check-types && pnpm --filter web build`.
