---
status: Accepted
area: platform
amends: ["0047"]
---

# 0048 — Read-only MCP Server Authorized by Personal Tokens

## Status

Accepted

## Context

Chat clients such as Claude.ai and Claude Code reach a user's data only through connectors, so the collector endpoint ([0047](0047-read-only-collector-endpoint-authorized-by-personal-tokens.md)) is out of their reach: they speak MCP, not a bespoke JSON route. The same personal tokens already identify a user, and the import format page and agent prompt exist for the spreadsheet conversion flow.

## Decision

- `/mcp` serves MCP over Streamable HTTP on the same Worker, stateless: each request builds a fresh server for the token's user, with no session store, Durable Object or `nodejs_compat`. It uses the official SDK v2 `@modelcontextprotocol/server` (`createMcpHandler`) with zod 4.
- It is authorized only by a personal token in `Authorization: Bearer`, which Claude.ai custom connectors (request headers) and Claude Code (`--header`) can send. A missing or invalid token answers the app's usual 401 JSON before any MCP handling, with no `WWW-Authenticate` header and no `/.well-known` routes, so there is no OAuth. Amending 0047, a token now authorizes the collector and `/mcp`, and still nothing that writes or manages tokens.
- Every MCP message is one authorized call and stamps `last_used_at`, an `UPDATE` on the token row with no new rows.
- The tool `list_measurements` (optional inclusive `from`/`to`) calls the same function as the collector route, so both return the same data and shape; the result is `structuredContent` plus the same JSON as a text block, and an invalid date is a tool result with `isError` and a pt-BR message, not a protocol error.
- The resource `bodylog://import-format` serves the Markdown of `/import-format.md`, and the prompt `convert_spreadsheet` carries the agent prompt text that Ajustes also copies, shared from root `domain/`, with that Markdown embedded.
- Everything a client shows the user (server, tool, resource and prompt titles and descriptions, the invalid-date message) is pt-BR; identifiers (`list_measurements`, `from`, `to`, the URI, JSON keys) stay English.
- `/mcp` is outside `/api/*`, so it is in `run_worker_first` in every `[assets]` config, and Vite proxies it in development.

## Consequences

- On Claude.ai Team and Enterprise the owner sets the connector's header, so every member reads the owner's data with the owner's token; per-member access would need OAuth, which this does not provide.
- Clients that open with a 2025-era handshake (the only kind exercised so far) are served by the SDK's stateless legacy leg, which frames replies as SSE. Non-POST methods get the SDK's 405.
- Alternatives not taken: Cloudflare `agents` (needs `nodejs_compat` and Durable Objects); SDK v1 (maintenance only); `@hono/mcp` (built on SDK v1); OAuth for MCP (an authorization server for a personal tracker).
- A tool that writes, or a second user-facing token scope, is a separate decision.
