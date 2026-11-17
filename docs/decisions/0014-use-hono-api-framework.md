---
status: Accepted
area: platform
---

# 0014 — Use Hono as the API Framework

## Status

Accepted

## Context

V1 targets Cloudflare Workers. The API framework needs to fit Web Standard runtimes and remain lightweight.

## Decision

Use Hono with TypeScript as the API framework on Cloudflare Workers.

## Consequences

The API can run naturally on Workers. Framework choices that assume a traditional Node server are not V1 targets.
