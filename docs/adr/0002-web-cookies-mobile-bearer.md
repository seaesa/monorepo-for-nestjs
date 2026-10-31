# 0002. Keep web sessions in httpOnly cookies and mobile sessions as bearer tokens

- Status: Accepted
- Date: 2026-11-17

## Context

Tokens in browser storage can be read by any injected script. Native apps have a secure keychain
but no reliable cookie jar.

## Decision

Same tokens, two transports. Web sends `x-auth-mode: cookie`; the API sets `access_token` and
`refresh_token` (path `/auth`) as httpOnly, `SameSite=Lax`, `Secure` in production, and requires
an allowed `Origin` on cookie-authenticated writes. Mobile stores tokens in `expo-secure-store`
and sends `Authorization: Bearer`. The guard accepts either. Refresh tokens rotate, single use,
tracked per session in Redis.

## Consequences

Web JavaScript never sees a token. Web and API must share a site (or `COOKIE_DOMAIN`). The client
package hides the difference behind `configureClient({ auth })`.
