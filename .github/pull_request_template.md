## What and why

<!-- The business change in one or two sentences, and the reason. Link the issue. -->

## How to verify

<!-- Steps a reviewer can follow, or the tests that cover it. -->

## Checklist

- [ ] `pnpm check` passes (and `pnpm test:e2e` if the API changed)
- [ ] Contract changes are additive, or web, mobile and API change together
- [ ] New user-facing text is in `packages/i18n` (en + vi); new error codes have a status and text
- [ ] Migration included and safe on a populated table (no long locks, backfill planned)
- [ ] Permissions changed only in `common/authorization`, with a case in `ability.spec.ts`
- [ ] Business rules changed → tests and the relevant `AGENTS.md` / `docs/agents` updated
- [ ] Architecture decision → ADR in `docs/adr/`
