# 0029 — Include Offline-first Logging in V2

## Status

Accepted

## Context

V1 deliberately shipped a manifest-only PWA. That made the app installable on
mobile without adding service-worker caching, local persistence, background
sync, or offline mutation handling.

After V1, the next useful PWA step is to keep the daily logging flow usable when
the network is unavailable or slow. The app should also be able to show the last
successfully loaded data on a cold PWA open instead of starting from an empty
state.

## Decision

Add offline-first logging as the final V2 task, after the redesign and
notification polish tasks.

The V2 offline-first work should include an offline-capable app shell, durable
last-known local data, queued measurement mutations, and sync after reconnecting.

## Consequences

V2 may introduce a service worker, Workbox or equivalent service-worker
tooling, browser local persistence, and background-sync behavior where
supported.

Offline-first behavior must remain single-user and must not introduce Google
Sheets integration, multi-user support, health interpretation, charts, or the
serverless Postgres migration.
