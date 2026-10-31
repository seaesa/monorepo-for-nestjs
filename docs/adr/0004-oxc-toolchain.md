# 0004. Lint and format with oxlint and oxfmt

- Status: Accepted
- Date: 2026-11-17

## Context

ESLint with type-aware rules and Prettier were the slowest steps of every hook and CI run, and
their configs were spread over each workspace.

## Decision

oxlint (type-aware via tsgolint) and oxfmt, configured in one root `.oxlintrc.json` and `.oxfmtrc.json`.
Rules that only exist as ESLint plugins (React Compiler, TanStack Query, turbo env vars) run inside
oxlint through `jsPlugins`. No ESLint or Prettier in the repo. Architecture rules are enforced
separately by dependency-cruiser; dead code by knip.

## Consequences

Lint and format run in seconds on every commit. A rule missing from oxlint is added through a
jsPlugin, not by reinstating ESLint.
