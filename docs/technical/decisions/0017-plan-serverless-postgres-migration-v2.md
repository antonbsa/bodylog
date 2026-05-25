# 0017 — Plan Serverless Postgres Migration for V2

## Status

Accepted for future version

## Context

Postgres is a stronger long-term option for portability, data modeling, and future growth, but migrating now would delay V1.

## Decision

Plan a future V2 migration from D1 to serverless Postgres.

## Consequences

V1 should isolate persistence behind repositories and avoid spreading D1-specific logic across handlers or domain code.
