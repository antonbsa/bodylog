# BodyLog V1 Acceptance Criteria

## Product

- The app supports one measurement per date.
- Weight is required.
- Body fat percentage, muscle percentage, and resting metabolism are optional.
- Selecting a date with an existing record loads that record for editing.
- Selecting a date without a record shows an empty creation form.

## Weekly Analysis

- Weeks start on Monday and end on Sunday.
- Weekly averages ignore missing days.
- Optional metric averages ignore missing values for that metric.
- Current partial week is compared against the previous full week.
- Percentage metrics show absolute variation in percentage points.
- Stable direction uses the documented V1 thresholds.
- The UI indicates up, down, or stable with one neutral color for every metric (`0031-use-neutral-variation-color.md`).
- The UI avoids health advice, diagnosis, recommendations, and motivational interpretation.
- The weekly registration count is displayed against a 7-day target, with the recorded days (`0035-use-seven-day-weekly-target.md`).

## Data Management

- Measurements can be created, edited, deleted, and listed.
- Measurements are listed by date descending.
- CSV export includes all records in the documented format.
- CSV import validates headers and rows, upserts by date, and reports invalid rows.

## Authentication

- A password is required before accessing the app.
- The password is stored as a secret or environment variable.
- Data routes require authentication.
- Logout is available.

## Technical

- Frontend uses React, Vite, and TypeScript.
- V1 UI direction is documented before frontend screens are implemented.
- Backend uses Hono and TypeScript on Cloudflare Workers.
- Persistence uses Cloudflare D1 in V1.
- Data access remains isolated behind repository/service boundaries.
- Relevant automated tests are added with implemented behavior.
- Deployment targets Cloudflare only.

## Production Readiness

- The production frontend is served by the API Worker through Workers Static Assets.
- The production API is reachable on Cloudflare Workers.
- The production frontend can call the production API.
- The production API has the production D1 binding configured.
- Production D1 migrations have been applied.
- Required production secrets and configuration are set without committing values.
- Authentication and secure session behavior work in production.
- Core V1 flows work against production data.
- Deployment automation can deploy the frontend and API from `main`.

## Final Validation

- README describes the actual project structure.
- AGENTS.md reflects the current implementation rules.
- Requirements match implemented behavior.
- API contract matches implemented routes.
- Data model matches migrations.
- Production readiness was validated through `specs/v1/tasks/t-025-validate-production-state.md`.
- Future ideas are documented separately from executable V1 tasks.
- V1 tasks live under `specs/v1/tasks/`.
