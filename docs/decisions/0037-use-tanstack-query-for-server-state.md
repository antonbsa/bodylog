---
status: Accepted
area: web
---

# 0037 — Use TanStack Query for Server State

## Status

Accepted

## Context

Each screen fetched its own data with hand-written effects and no shared cache. On `/registro` the form emptied, showed "Carregando…" and refilled on every day change, and every tab switch refetched from an empty state.

## Decision

Use TanStack Query (`@tanstack/react-query`) in `apps/web` with one `QueryClient` created in `main.tsx`, with retries off so errors show at once. The functions in `apps/web/src/api/` stay the query functions, and keys live in `apps/web/src/api/queryKeys.ts` under the `measurements` and `dashboard` prefixes.

Saves, deletes and CSV imports invalidate both prefixes, and logout clears the cache. Registro prefetches the previous day and, when it is not in the future, the next day, so the date arrows are instant and a revisited day shows its cached values while it refreshes in the background. A background refetch resets the form only while it has no edits.

## Alternatives considered

A hand-written cache local to Registro, rejected because the other redesigned screens need the same caching and invalidation.

## Consequences

New runtime dependency in `apps/web`. Cached data shows before a background refetch lands, so screens must not treat a refetch as a reset of user input.
