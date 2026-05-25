# Implementation Plan

## Goal

Implement V1 of Body Metrics Tracker with a functional, mobile-first experience and simple Cloudflare deployment.

## Phases

### Phase 0 — Technical Validation

Goal: remove risks that could block the architecture.

Main tasks:

- Create the API base with Hono on Cloudflare Workers.
- Validate local and remote D1 usage.
- Validate simple authentication with cookies.
- Choose the final deployment strategy: Cloudflare Pages + separate Worker.

Expected result:

- Minimal Hono API working.
- Initial project base created.
- Minimal Worker deployment working.
- Deployment strategy recorded.

---

### Phase 1 — Project Base

Goal: create the minimum app structure.

Main tasks:

- Create a monorepo or simple project structure.
- Configure TypeScript.
- Configure React/Vite frontend.
- Configure Hono backend.
- Configure unit and E2E test tooling.
- Configure CI workflow for PRs and pushes to `main`.
- Configure lint/typecheck.
- Configure basic PWA setup.
- Configure expected variables/secrets.

Expected result:

- App opens.
- API responds to healthcheck.
- Typecheck and baseline tests pass locally and in CI.

---

### Phase 2 — Database and Domain

Goal: implement persistence and core rules.

Main tasks:

- Create the `measurements` migration.
- Implement the measurement repository.
- Implement derived calculations.
- Implement weekly grouping.
- Implement weekly comparison.
- Create tests for formulas and week logic.

Expected result:

- Core calculations work independently from the UI.

---

### Phase 3 — Authentication

Goal: protect personal data.

Main tasks:

- Create login screen.
- Create login endpoint.
- Create signed session.
- Protect API routes.
- Create logout.

Expected result:

- The user can access the dashboard only when authenticated.

---

### Phase 4 — Measurement CRUD

Goal: enable daily usage.

Main tasks:

- Create endpoint to list records.
- Create endpoint to fetch by date.
- Create endpoint to upsert by date.
- Create endpoint to delete.
- Create mobile-first form.
- Implement existing-date vs empty-date behavior.
- Create measurement list.

Expected result:

- The user can create, edit, delete, and list measurements.

---

### Phase 5 — Weekly Dashboard

Goal: deliver the main analytical value of V1.

Main tasks:

- Create weekly dashboard endpoint.
- Create average cards.
- Create variation cards.
- Show direction with text and icon.
- Indicate partial week.
- Indicate measurement count.

Expected result:

- The user can understand weekly evolution without opening a spreadsheet.

---

### Phase 6 — CSV Export

Goal: provide manual backup.

Main tasks:

- Create CSV export endpoint.
- Create export button.
- Validate exported format.

Expected result:

- The user can download a CSV with records.

---

### Phase 7 — CSV Import

Goal: populate historical spreadsheet data.

Main tasks:

- Create CSV upload endpoint.
- Validate headers.
- Validate rows.
- Upsert by date.
- Return import summary.
- Create import UI.

Expected result:

- The user can import history without manual entry.

---

### Phase 8 — Final Polish and Validation

Goal: close a usable V1.

Main tasks:

- Review mobile UX.
- Test PWA installability.
- Test deployment.
- Confirm deployment workflow works.
- Test full flows.
- Update documentation.
- Register V1.1/V2 pending items.

Expected result:

- V1 is ready for daily personal use.
