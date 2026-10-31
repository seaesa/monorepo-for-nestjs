# 0005. Make errors codes and keep all text in @repo/i18n

- Status: Accepted
- Date: 2026-11-17

## Context

Clients that branch on messages or status codes break when wording changes, and messages written
on the server cannot follow the user's language.

## Decision

The API throws `AppException(ErrorCode.X, { field? })` only; every error response is
`ApiErrorBody` with a stable `code` and optional field errors (`code` + `params`). Frontends
branch on `code` and translate it. Every user-facing string, including emails and pushes sent by
the server in the user's saved locale, lives in `packages/i18n` (en is the source, vi is typed
against it).

## Consequences

New error code = `ErrorCode` + `errorStatus` + en/vi text, enforced by types and a test. Copy
changes never require an API release.
