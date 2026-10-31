# Performance

Defaults that keep the system fast as data and traffic grow. Break one only with a measured reason.

## Database

- Every list is paginated (`paginationQuerySchema` + `pageArgs`/`pageMeta`); no unbounded `findMany`.
- Index what lists filter and sort by, starting with the owner (`@@index([ownerId, status, createdAt])`).
- Select only needed columns for large rows; never load a relation you don't return.
- No queries in loops. Batch with `in`, `createMany`, or a single join.
- Run the page query and the count in parallel (`Promise.all([findMany, count])`); a list does not need a transaction.
- Unique constraints enforce invariants; don't check-then-insert (race). Let `P2002` map to `CONFLICT`.

## API

- Slow, retryable or deferred work goes to a queue; the request returns as soon as the write is done.
- Realtime events carry the changed entity (or its id) so clients update the cache without refetching.
- Redis keys are namespaced and have a TTL unless they are meant to live forever.
- Rate limits are global; tighten sensitive routes (`@Throttle`) such as login and password reset.

## Frontend data

- Server data only through react-query hooks. Reuse `queryOptions` for prefetching.
- After a mutation, write the returned entity into its detail cache and invalidate lists; don't
  refetch everything.
- `placeholderData: keepPreviousData` for paginated/filtered lists so they don't flash empty.
- Select narrow slices from stores (`useStore((s) => s.user)`), never the whole store.

## Rendering

- React Compiler rules are linted; don't add `useMemo`/`useCallback` by reflex.
- Mobile lists use `FlatList` (or FlashList) with `keyExtractor`; never nest a list in a `ScrollView`.
- Web: server components by default; `'use client'` only on interactive leaves. Use `next/image`.
- Don't import whole icon or date libraries for one function; import what you use.
