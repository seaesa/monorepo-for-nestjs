# Quality gates

`pnpm check` runs all of these; CI runs `pnpm check` and the API e2e suite on every push/PR.

| Gate           | Tool                             | Catches                                                             |
| -------------- | -------------------------------- | ------------------------------------------------------------------- |
| `format:check` | oxfmt                            | formatting, import order, Tailwind class order                      |
| `lint:pkg`     | sherif                           | inconsistent dependency versions, workspace hygiene                 |
| `lint:dead`    | knip                             | unused files, exports and dependencies                              |
| `lint:deps`    | dependency-cruiser               | cycles, layer and feature boundary violations                       |
| `lint:spell`   | cspell                           | typos in code and docs (project words: `.cspell/project-words.txt`) |
| `lint:dup`     | jscpd                            | copy-pasted code (>1%, 8+ lines)                                    |
| `lint`         | oxlint (type-aware) + JS plugins | correctness, hooks, react-query, turbo env, promises                |
| `check-types`  | tsc                              | types                                                               |
| `test`         | Jest                             | business rules                                                      |
| `build`        | turbo                            | every package and app builds                                        |

## Lint config

One `.oxlintrc.json` at the repo root lints every workspace in one run (a few seconds,
type-aware through each file's nearest `tsconfig`). Workspaces have no lint config or script.

- Rules for one area go in an `overrides` entry by glob (`apps/web/**`, `**/components/ui/**`).
  An override that turns off a plugin rule must list that plugin in its own `plugins`, or the
  rule stays on.
- ESLint-only rules (React Compiler hooks, TanStack Query, turbo env vars) run inside oxlint via
  `jsPlugins`; there is no ESLint in the repo.
- `--deny-warnings`: a warning fails CI.
- Turning a rule off needs a reason. Prefer a narrow override to a global off; per line,
  `// oxlint-disable-next-line <rule> -- <reason>` only when the code is right and the rule wrong.
- A new rule that fails existing code lands with the fixes in the same change.

## Fixing a failure

- Fix the cause; don't silence the tool. A disable comment needs a reason on the same line, and a
  config-level exception needs the reason in the commit message.
- knip "unused export": delete it, or stop exporting it.
- jscpd clone: extract the shared part to its proper home (see `conventions.md`), or accept the
  duplication if the two copies will diverge (web vs mobile screens), and say so in review.
- cspell: real word → add to `.cspell/project-words.txt`; typo → fix it.

## Git hooks (lefthook)

- pre-commit: oxfmt (re-stages the fix), oxlint and cspell on staged files.
- commit-msg: commitlint (Conventional Commits; scope = workspace from `commitlint.config.ts`).
- pre-push: `check-types`, `lint:deps`, `lint:dead`.

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `style`, `revert`.
Subject in the imperative, lower case, no period: `feat(api): add task reminders`.

## Pull requests and releases

- `.github/pull_request_template.md`: the checklist a reviewer expects to be ticked.
- `.github/CODEOWNERS`: contracts, i18n, the Prisma schema, authorization and CI need an owner's
  review.
- release-please turns merged commits into the version and changelog; see
  `docs/agents/mobile-release.md`.

## Dependencies

Renovate opens weekly PRs (non-major grouped, Expo SDK packages grouped, majors reviewed by hand).
Shared versions live in the catalog in `pnpm-workspace.yaml`. Expo-managed versions are upgraded
with `npx expo install --fix`, never by hand.

## Security (`.github/workflows/security.yml`)

Runs on every PR, on `main` and weekly:

- **gitleaks**: secrets in the git history. A leaked secret is rotated first, then removed;
  deleting the commit does not un-leak it.
- **osv-scanner**: known vulnerabilities in `pnpm-lock.yaml`. Fix with
  `pnpm audit --fix update` (re-resolves within ranges), then upgrade the parent package. Only
  when no fix exists, add an entry to `osv-scanner.toml` with a `reason` and an `ignoreUntil`
  date (at most 3 months); never ignore without both.
- **CodeQL** (`security-extended`): injection, path traversal, unsafe regex and similar in our
  own code. Treat a finding like a failing test.
