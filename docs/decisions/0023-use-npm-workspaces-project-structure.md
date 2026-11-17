---
status: Accepted
area: platform
---

# 0023 — Use npm Workspaces Project Structure

## Status

Accepted

## Context

BodyLog V1 has a separate React/Vite frontend and Hono Worker API. The deployment strategy also separates Cloudflare Pages for the frontend from a Cloudflare Worker for the API.

Keeping all code in one root package would become unclear once frontend tooling, Worker tooling, API tests, E2E tests, and deployment scripts are all present.

## Decision

Use npm workspaces with application packages under `apps/`.

Initial structure:

```txt
apps/
  api/
  web/
tests/
  api/
  e2e/
```

The root package remains the main command entry point for install, typecheck, unit tests, E2E tests, D1 commands, and API deployment.

## Consequences

API code lives under `apps/api`.

The frontend package starts as a TypeScript placeholder and will receive the React/Vite implementation during the frontend configuration task.

Root scripts should delegate to workspace scripts where useful while keeping common commands simple for local development and CI.
