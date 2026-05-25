# Tasks

## Phase 0 — Technical Validation

### T-001 — Create Hono API Base on Cloudflare Workers

Related: ADR-014.

#### Acceptance Criteria

- [x] Create a minimal Hono app.
- [x] Run locally through Wrangler.
- [x] Deploy to Cloudflare Workers.
- [x] Create `/api/health` route.
- [x] Confirm basic middleware works.
- [x] Confirm the structure supports `/api/*` routes.
- [x] Document minimum development and deployment commands.

Deployment URL: `https://bodylog-api.antonbsa.workers.dev/`

---

### T-002 — Validate D1

Related: ADR-016.

#### Acceptance Criteria

- [ ] Create local D1 database.
- [ ] Create remote D1 database.
- [ ] Run initial migration.
- [ ] Execute a simple query through the API.
- [ ] Document migration command.

---

### T-003 — Define Deployment Strategy

Related: `docs/technical/03-deployment.md`.

#### Acceptance Criteria

- [ ] Choose Pages + separate Worker or single Worker with assets.
- [ ] Record the decision.
- [ ] Create minimal deployment.

---

## Phase 1 — Base

### T-004 — Create Project Structure

#### Acceptance Criteria

- [ ] Create frontend/backend structure.
- [ ] Configure TypeScript.
- [ ] Configure unit test tooling.
- [ ] Configure E2E test tooling.
- [ ] Configure main scripts.
- [ ] Add initial technical README notes if needed.

---

### T-005 — Configure Frontend

#### Acceptance Criteria

- [ ] React + Vite working.
- [ ] TypeScript working.
- [ ] Build working.
- [ ] Initial page renders.

---

### T-006 — Configure Basic PWA

#### Acceptance Criteria

- [ ] Manifest created.
- [ ] Minimum icons configured.
- [ ] App installable on smartphone.
- [ ] Full offline-first behavior not implemented.

---

### T-007 — Configure CI Checks

#### Acceptance Criteria

- [ ] Workflow runs on pull requests targeting `main`.
- [ ] Workflow runs on direct pushes to `main`.
- [ ] Workflow installs dependencies reproducibly.
- [ ] Workflow runs typecheck.
- [ ] Workflow runs unit/API tests.
- [ ] Workflow runs E2E tests once E2E tooling exists.
- [ ] Required workflow secrets, if any, are documented.

---

## Phase 2 — Database and Domain

### T-008 — Create Measurements Migration

#### Acceptance Criteria

- [ ] `measurements` table created.
- [ ] `date` field is unique.
- [ ] `weight_kg` is required.
- [ ] Optional fields are nullable.
- [ ] Migration works locally and remotely.

---

### T-009 — Implement Measurement Repository

#### Acceptance Criteria

- [ ] Create measurement.
- [ ] Update measurement by date.
- [ ] Get measurement by date.
- [ ] List measurements by date descending.
- [ ] Delete measurement.
- [ ] SQL is contained in repository layer.
- [ ] Repository behavior is covered by automated tests or documented local D1 validation.

---

### T-010 — Implement Derived Calculations

#### Acceptance Criteria

- [ ] BMI calculated from configured height.
- [ ] Body fat mass calculated when possible.
- [ ] Muscle mass calculated when possible.
- [ ] Missing optional fields return `null` derived values.
- [ ] Unit tests cover derived calculation behavior.

---

### T-011 — Implement Weekly Logic

#### Acceptance Criteria

- [ ] Week starts on Monday.
- [ ] Week ends on Sunday.
- [ ] Missing days are ignored.
- [ ] Missing metric values are ignored per metric.
- [ ] Weekly averages are calculated correctly.
- [ ] Current partial week is compared against previous full week.
- [ ] Percentage metrics use percentage points for absolute difference.
- [ ] Unit tests cover week boundaries, missing values, averages, and comparison rules.

---

## Phase 3 — Authentication

### T-012 — Implement Login

#### Acceptance Criteria

- [ ] Login screen created.
- [ ] Login endpoint created.
- [ ] Password read from secret/environment.
- [ ] Invalid password returns clear error.
- [ ] Valid login creates session.
- [ ] Login behavior is covered by backend tests and E2E coverage for the screen flow.

---

### T-013 — Protect Routes

#### Acceptance Criteria

- [ ] Measurement API requires authentication.
- [ ] Dashboard API requires authentication.
- [ ] CSV import/export require authentication.
- [ ] Unauthenticated users are redirected or receive 401.
- [ ] Protected route behavior is covered by automated tests.

---

### T-014 — Implement Logout

#### Acceptance Criteria

- [ ] Logout endpoint created.
- [ ] Logout clears session.
- [ ] User returns to login screen.

---

## Phase 4 — Measurement CRUD

### T-015 — Implement Measurement Form

#### Acceptance Criteria

- [ ] Form opens from dashboard.
- [ ] Date defaults to today.
- [ ] User can change date.
- [ ] Existing date loads existing record.
- [ ] Empty date shows empty fields.
- [ ] Only weight is required.
- [ ] Save creates or updates by date.
- [ ] E2E tests cover create and existing-date edit behavior.

---

### T-016 — Implement Measurement List

#### Acceptance Criteria

- [ ] Measurements listed by date descending.
- [ ] Raw values shown.
- [ ] Derived values shown when possible.
- [ ] Missing optional values handled clearly.
- [ ] Edit action available.
- [ ] Delete action available.
- [ ] E2E or component-level tests cover list rendering states.

---

### T-017 — Implement Delete Confirmation

#### Acceptance Criteria

- [ ] User must confirm before deletion.
- [ ] Deleted record disappears from list.
- [ ] Dashboard recalculates after deletion.
- [ ] E2E tests cover delete confirmation and resulting UI update.

---

## Phase 5 — Weekly Dashboard

### T-018 — Implement Weekly Dashboard API

#### Acceptance Criteria

- [ ] Returns current week summary.
- [ ] Returns previous week summary.
- [ ] Returns variation object.
- [ ] Includes measurement counts.
- [ ] Indicates partial current week.
- [ ] API or service tests cover dashboard summary and variation output.

---

### T-019 — Implement Dashboard UI

#### Acceptance Criteria

- [ ] Dashboard is initial authenticated screen.
- [ ] Shows weekly average cards.
- [ ] Shows variation cards.
- [ ] Shows up/down/stable indicators.
- [ ] Shows partial week notice.
- [ ] Has button to register measurement.
- [ ] Mobile-first layout.
- [ ] E2E tests cover the authenticated dashboard display.

---

## Phase 6 — CSV Export

### T-020 — Implement CSV Export

#### Acceptance Criteria

- [ ] Export endpoint returns CSV.
- [ ] CSV includes all records.
- [ ] CSV uses documented headers.
- [ ] UI has export action.
- [ ] Automated tests cover exported headers and row values.

---

## Phase 7 — CSV Import

### T-021 — Implement CSV Import

#### Acceptance Criteria

- [ ] Upload endpoint accepts CSV file.
- [ ] Headers are validated.
- [ ] Rows are validated.
- [ ] Records are upserted by date.
- [ ] Import summary is returned.
- [ ] Invalid rows are reported.
- [ ] UI has import action.
- [ ] Automated tests cover valid import, invalid rows, and upsert by date.

---

## Phase 8 — Final Validation

### T-022 — Configure Deployment Automation

#### Acceptance Criteria

- [ ] Deployment workflow is created after the Cloudflare deployment strategy is chosen.
- [ ] Deployment workflow runs on direct pushes to `main`.
- [ ] Deployment workflow runs automated checks before deploy.
- [ ] Deployment workflow deploys to the selected Cloudflare target.
- [ ] Required deployment secrets are documented.
- [ ] Deployment workflow does not commit or expose secrets.

---

### T-023 — Validate V1 End-to-End

#### Acceptance Criteria

- [ ] Login works.
- [ ] Create measurement works.
- [ ] Edit measurement works.
- [ ] Delete measurement works.
- [ ] List works.
- [ ] Dashboard works.
- [ ] CSV export works.
- [ ] CSV import works.
- [ ] PWA installability works.
- [ ] Production deployment works.
- [ ] Unit tests pass.
- [ ] API/backend tests pass.
- [ ] E2E tests pass.
- [ ] CI checks pass on `main`.
- [ ] Deployment automation works.
- [ ] Docs reflect final behavior.
