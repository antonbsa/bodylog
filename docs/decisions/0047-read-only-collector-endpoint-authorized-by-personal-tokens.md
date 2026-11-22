---
status: Accepted
area: platform
---

# 0047 — Read-only Collector Endpoint Authorized by Personal Tokens

## Status

Accepted

## Context

External tools and AI agents that check a user's body metrics need that user's measurements as structured data without someone exporting them by hand, and a cookie session doesn't work for a script. The CSV export is a file for people to open, so its shape is not a contract a script should depend on. With accounts (ADR 0044), each user creates their own named personal API tokens in Ajustes, so a token identifies the user it belongs to.

## Decision

- `GET /api/collector/measurements` returns the token owner's measurements as JSON, with optional inclusive `from`/`to` real calendar dates, ordered by date ascending, without pagination.
- It is authorized only by `Authorization: Bearer <personal token>` (scheme case-insensitive). The token's SHA-256 finds its row, which gives the user and records `last_used_at` on every authorized call. The session cookie does not authorize it, and a token authorizes no other route, so the CSV export, every write, the import and token management stay behind the session.
- A missing, malformed, unknown or revoked token returns the same `UnauthorizedError`, so the response never tells which case it was.
- Items list their fields explicitly, without the internal `id` (one measurement per date per user makes `date` the key), so the contract changes only on purpose. `heightCm` is the user's and is `null` until set, and then BMI is `null` too (ADR 0046).

## Consequences

- Anyone holding a token can read every measurement of its owner; revoking it in Ajustes stops it on the next request, and the other tokens keep working.
- Every authorized call writes one row, which is what lets Ajustes show the last use.
- Alternatives not taken: one global `COLLECTOR_TOKEN` secret (identifies no user); the token on the CSV export (a human-facing file as a script contract); pushing exports to cloud storage (third-party credentials and a write path in the Worker); scopes, expiry, pagination and an `updatedSince` filter (more than the current clients need).
- Pulling a user's measurements with a token is not the Google Sheets or push-sync integration that [0004](0004-exclude-google-sheets-integration-v1.md) excludes.
