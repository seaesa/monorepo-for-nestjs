# 0003. Declare permissions once with CASL

- Status: Accepted
- Date: 2026-11-17

## Context

Hand-written `where: { ownerId }` filters are repeated per query; one forgotten filter leaks data,
and adding a role means editing every service.

## Decision

`apps/api/src/common/authorization/ability.ts` is the only place permissions are defined
(`defineAbilityFor(actor)`, roles on `User.role`). Services receive the actor and turn the ability
into Prisma filters with `accessibleBy(ability, action).ofType('Model')`. Records the actor may
not access are reported as not found.

## Consequences

A new role or model is a change in one file plus a case in `ability.spec.ts`. The role is in the
access token, so a change applies at the next refresh (within 15 minutes).
