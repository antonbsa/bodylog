# 0019 — Use Cloudflare Pages and Separate Worker

## Status

Accepted

## Context

The app has a React/Vite frontend and a Hono API. Both should stay understandable, testable, and deployable while remaining fully on Cloudflare.

## Decision

Deploy the React/Vite frontend to Cloudflare Pages and the Hono API to a separate Cloudflare Worker. Local development also uses separate processes: Vite for the frontend and Wrangler for the API Worker.

## Consequences

The frontend needs an environment-configured API base URL. The API needs CORS and cookie/session settings compatible with the Pages frontend origin. Deployment automation needs to handle both Cloudflare Pages and the Worker.
