# 0015 — Use Cloudflare-only Deployment for V1

## Status

Accepted

## Context

Supporting multiple deployment platforms would add compatibility work that does not help V1 delivery.

## Decision

Deploy V1 fully on Cloudflare.

## Consequences

V1 does not need Vercel compatibility. Cloudflare Workers, Pages, D1, and secrets define the deployment environment.
