---
status: Superseded
area: delivery
superseded-by: ["0040"]
---

# 0028 — Use Same-Site Custom Domains for PWA Session

## Status

Superseded by [0040 — Serve the Web App from the API Worker](./0040-serve-the-web-app-from-the-api-worker.md)

## Context

When BodyLog is installed to the iOS home screen, the standalone web app dropped
the API session cookie after being closed and reopened, forcing re-login. The
production frontend (Cloudflare Pages, `*.pages.dev`) and API (Cloudflare Worker,
`*.workers.dev`) were on different registrable domains, so the session cookie was
cross-site and required `Secure` + `SameSite=None`. iOS standalone web apps can
drop or omit such cross-site cookies. iOS Passwords also did not offer to save or
autofill the password.

## Decision

Serve the production frontend and API from same-site custom domains under one
parent domain:

- Frontend: `https://bodylog.antonbsa.dev`
- API: `https://api.bodylog.antonbsa.dev`

The API derives session cookie attributes from the request host and the configured
`PRODUCTION_FRONTEND_ORIGIN`:

- localhost / 127.0.0.1 → `SameSite=Lax`, `Secure=false`
- request and frontend origin same-site (same protocol, same-or-child hostname) →
  `SameSite=Lax`, `Secure=true`
- otherwise (cross-site default domains) → `SameSite=None`, `Secure=true`

The cross-site `SameSite=None` path is kept as a fallback so deployments still work
on the default Cloudflare domains.

## Consequences

- Installed iOS PWA keeps its session across close/reopen under the custom-domain
  layout.
- Production requires configuring custom domains for both the Pages project and the
  Worker, and setting `PRODUCTION_FRONTEND_ORIGIN` plus `VITE_API_BASE_URL` to the
  custom-domain values.
- The login form carries password-manager metadata (a hidden stable `username`
  field and password autocomplete attributes) so iOS Passwords associates the saved
  credential with the app.
- Cookie behavior now depends on host matching; auth tests must cover localhost,
  same-site, and cross-site cases.
