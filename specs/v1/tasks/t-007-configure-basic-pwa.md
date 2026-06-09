# T-007 — Configure Basic PWA

## Status

Done

## Description

Configure the React/Vite frontend with the minimum assets and metadata needed for basic PWA installability.

This task only covers manifest and icon setup. It must not add a service worker, offline storage, background sync, or offline-first behavior.

## Implementation Plan

- Add a web app manifest to the frontend public assets.
- Add minimum app icons for common installability checks.
- Link the manifest and theme metadata from the HTML entrypoint.
- Add a browser-level smoke check that verifies the manifest and referenced icons are reachable.
- Validate the existing build, typecheck, lint, unit/API test, and E2E commands.

## Why
This task advances BodyLog V1 during the Project Base phase.
## Scope
Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.
## Out of Scope
Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.
## Validation

Automated checks:

- `npm run build:web`
- `npm run typecheck`
- `npm run lint`
- `npm run test:api`
- `npm run test:e2e`

Browser validation:

- Playwright verifies the page links `/manifest.webmanifest`.
- Playwright verifies the manifest includes `name`, `id`, `start_url`, `display`, `theme_color`, and `192x192` / `512x512` PNG icons.
- Playwright verifies all manifest icons and the Apple touch icon are reachable from Vite.
- Chromium `Page.getInstallabilityErrors` returned no installability errors for the local app.

## Implementation Notes

- Added a web app manifest under the frontend public assets.
- Added SVG source icon and generated `192x192` and `512x512` PNG icons.
- Linked manifest, theme color, favicon, Apple touch icon, and iOS web app metadata from the HTML entrypoint.
- Did not add a service worker, offline cache, background sync, or offline-first behavior.
- Extended the existing E2E smoke test to cover basic PWA installability assets and Chromium installability diagnostics.

## Modified Files

- `apps/web/index.html`
- `apps/web/public/icon.svg`
- `apps/web/public/icons/icon-192.png`
- `apps/web/public/icons/icon-512.png`
- `apps/web/public/manifest.webmanifest`
- `specs/v1/implementation-plan.md`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-007-configure-basic-pwa.md`
- `tests/e2e/tooling.spec.ts`


## Acceptance Criteria

- [x] Manifest created.
- [x] Minimum icons configured.
- [x] App installable on smartphone.
- [x] Full offline-first behavior not implemented.


## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
