# 0001. Drive API, web and mobile from one zod contract

- Status: Accepted
- Date: 2026-11-17

## Context

Three clients of one API drift apart when each writes its own types and validation: a field
renamed on the server breaks mobile builds already in the stores, and the same rule is coded
three times with three different messages.

## Decision

`packages/contracts` defines every route (`defineRoute`) with zod schemas for body, query and
response. The API binds routes with `@Endpoint(route)` (validation and response serialization),
frontends call them with `request(route, input)`, and forms use the same schemas. OpenAPI is
generated from it. The package stays pure (zod only) so it runs everywhere.

## Consequences

Type errors replace runtime drift. Any API change starts in contracts and touches all consumers
in one change. Mobile versions in the wild keep old shapes, so changes must be additive.
No tRPC/GraphQL layer: plain REST stays cacheable and documentable.
