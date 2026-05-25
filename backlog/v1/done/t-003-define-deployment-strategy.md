# T-003 — Define Deployment Strategy

Status: Done

Phase: Technical Validation

Related documentation: [Deployment](../../../docs/technical/deployment.md)

## Acceptance Criteria

- [x] Choose Pages + separate Worker or single Worker with assets.
- [x] Record the decision.
- [x] Create minimal deployment.

## Notes

Decision: Cloudflare Pages frontend + separate Cloudflare Worker API.

Minimal deployment for Phase 0: Worker API deployed at `https://bodylog-api.antonbsa.workers.dev/`.

Minimal Pages deployment will be created with the frontend base because the frontend does not exist yet.
