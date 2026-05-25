# Tasks

## Phase 0 — Technical Validation

### T-001 — Create Hono API Base on Cloudflare Workers

Related: ADR-014.

#### Acceptance Criteria

- [ ] Create a minimal Hono app.
- [ ] Run locally through Wrangler.
- [ ] Deploy to Cloudflare Workers.
- [ ] Create `/api/health` route.
- [ ] Confirm basic middleware works.
- [ ] Confirm the structure supports `/api/*` routes.
- [ ] Document minimum development and deployment commands.

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

## Phase 2 — Database and Domain

### T-007 — Create Measurements Migration

#### Acceptance Criteria

- [ ] `measurements` table created.
- [ ] `date` field is unique.
- [ ] `weight_kg` is required.
- [ ] Optional fields are nullable.
- [ ] Migration works locally and remotely.

---

### T-008 — Implement Measurement Repository

#### Acceptance Criteria

- [ ] Create measurement.
- [ ] Update measurement by date.
- [ ] Get measurement by date.
- [ ] List measurements by date descending.
- [ ] Delete measurement.
- [ ] SQL is contained in repository layer.
- [ ] Repository behavior is covered by automated tests or documented local D1 validation.

---

### T-009 — Implement Derived Calculations

#### Acceptance Criteria

- [ ] BMI calculated from configured height.
- [ ] Body fat mass calculated when possible.
- [ ] Muscle mass calculated when possible.
- [ ] Missing optional fields return `null` derived values.
- [ ] Unit tests cover derived calculation behavior.

---

### T-010 — Implement Weekly Logic

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

### T-011 — Implement Login

#### Acceptance Criteria

- [ ] Login screen created.
- [ ] Login endpoint created.
- [ ] Password read from secret/environment.
- [ ] Invalid password returns clear error.
- [ ] Valid login creates session.
- [ ] Login behavior is covered by backend tests and E2E coverage for the screen flow.

---

### T-012 — Protect Routes

#### Acceptance Criteria

- [ ] Measurement API requires authentication.
- [ ] Dashboard API requires authentication.
- [ ] CSV import/export require authentication.
- [ ] Unauthenticated users are redirected or receive 401.
- [ ] Protected route behavior is covered by automated tests.

---

### T-013 — Implement Logout

#### Acceptance Criteria

- [ ] Logout endpoint created.
- [ ] Logout clears session.
- [ ] User returns to login screen.

---

## Phase 4 — Measurement CRUD

### T-014 — Implement Measurement Form

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

### T-015 — Implement Measurement List

#### Acceptance Criteria

- [ ] Measurements listed by date descending.
- [ ] Raw values shown.
- [ ] Derived values shown when possible.
- [ ] Missing optional values handled clearly.
- [ ] Edit action available.
- [ ] Delete action available.
- [ ] E2E or component-level tests cover list rendering states.

---

### T-016 — Implement Delete Confirmation

#### Acceptance Criteria

- [ ] User must confirm before deletion.
- [ ] Deleted record disappears from list.
- [ ] Dashboard recalculates after deletion.
- [ ] E2E tests cover delete confirmation and resulting UI update.

---

## Phase 5 — Weekly Dashboard

### T-017 — Implement Weekly Dashboard API

#### Acceptance Criteria

- [ ] Returns current week summary.
- [ ] Returns previous week summary.
- [ ] Returns variation object.
- [ ] Includes measurement counts.
- [ ] Indicates partial current week.
- [ ] API or service tests cover dashboard summary and variation output.

---

### T-018 — Implement Dashboard UI

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

### T-019 — Implement CSV Export

#### Acceptance Criteria

- [ ] Export endpoint returns CSV.
- [ ] CSV includes all records.
- [ ] CSV uses documented headers.
- [ ] UI has export action.
- [ ] Automated tests cover exported headers and row values.

---

## Phase 7 — CSV Import

### T-020 — Implement CSV Import

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

### T-021 — Validate V1 End-to-End

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
- [ ] Docs reflect final behavior.
