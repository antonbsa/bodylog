# Technical Decisions

## ADR-001 — Use Lightweight SDD

### Status

Accepted.

### Decision

The project will use lightweight SDD with spec-first and spec-anchored practices, without strict spec-as-source.

### Reason

The goal is to deliver a functional V1 and use the project for learning without turning documentation into bureaucracy.

---

## ADR-002 — V1 Mobile-first

### Status

Accepted.

### Decision

V1 will be designed primarily for smartphone usage.

### Reason

Logging happens almost always right after a scale measurement, and the phone is the most practical device in that context.

---

## ADR-003 — Desktop Is Not a V1 Focus

### Status

Accepted.

### Decision

Desktop should work minimally, but desktop-friendly dashboards are deferred to future versions.

### Reason

The main value of V1 is quick logging and simple weekly visualization.

---

## ADR-004 — No Google Sheets Integration in V1

### Status

Accepted.

### Decision

V1 will not include automatic Google Sheets integration.

### Reason

The integration would add complexity and delay risk. CSV export is enough for initial backup.

---

## ADR-005 — CSV Export in V1

### Status

Accepted.

### Decision

V1 will include CSV export.

### Reason

It provides simple manual backup without external integration.

---

## ADR-006 — CSV Import in V1

### Status

Accepted.

### Decision

V1 will include CSV import as the last feature, to populate historical data from the current spreadsheet.

### Reason

This avoids manually entering historical data.

---

## ADR-007 — One Record per Date

### Status

Accepted.

### Decision

The system will allow at most one record per date.

### Reason

The current workflow is based on one daily measurement under similar conditions.

---

## ADR-008 — Date Form Creates or Edits

### Status

Accepted.

### Decision

When a selected date already has a record, the form loads that record for editing. When the selected date has no record, the form is empty for creation.

### Reason

This reduces duplication and simplifies UX.

---

## ADR-009 — Only Weight Is Required in V1

### Status

Accepted.

### Decision

Only weight is required in V1.

### Reason

This allows partial logging when the scale or routine does not provide all data.

---

## ADR-010 — Week Starts on Monday

### Status

Accepted.

### Decision

All weekly averages use Monday-to-Sunday weeks.

### Reason

This matches the desired weekly tracking model.

---

## ADR-011 — Compare Partial Current Week Against Previous Full Week

### Status

Accepted.

### Decision

V1 compares the current week, even when incomplete, against the previous full week.

### Reason

This provides continuous feedback during the week, even if the comparison is not perfectly equivalent.

---

## ADR-012 — Neutral Variation Interpretation

### Status

Accepted.

### Decision

In V1, the system shows whether a metric went up, down, or stayed stable, without saying whether that is good or bad.

### Reason

Interpretation depends on the current goal, physiological context, and training/diet phase.

---

## ADR-013 — TypeScript Everywhere

### Status

Accepted.

### Decision

Frontend and backend will be implemented in TypeScript.

### Reason

This improves consistency, type safety, and technical learning.

---

## ADR-014 — Hono as the API Framework

### Status

Accepted.

### Decision

V1 will use Hono + TypeScript as the API framework on Cloudflare Workers.

### Reason

Hono is well-suited for Workers and Web Standard runtimes, making it a better fit than Fastify for the Cloudflare-only V1.

---

## ADR-015 — Cloudflare-only Deployment for V1

### Status

Accepted.

### Decision

V1 will be deployed fully on Cloudflare.

### Reason

This keeps the deployment target simple and avoids cross-platform compatibility work.

---

## ADR-016 — Cloudflare D1 as the V1 Database

### Status

Accepted.

### Decision

V1 will use Cloudflare D1 as the database.

### Reason

D1 is native to Cloudflare and fits a small personal app deployed on Workers.

---

## ADR-017 — Serverless Postgres Migration Planned for V2

### Status

Accepted for future version.

### Decision

V2 should migrate from D1 to serverless Postgres.

### Reason

Postgres is a stronger long-term option for portability, data modeling, and future growth. V1 should avoid coupling too much code to D1 so this migration remains manageable.

---

## ADR-018 — Basic PWA in V1

### Status

Accepted.

### Decision

V1 will include basic PWA installability but not full offline-first behavior.

### Reason

Installability improves mobile usage with limited complexity. Offline-first behavior is useful but should be deferred.

---

## ADR-019 — Cloudflare Pages and Separate Worker Deployment

### Status

Accepted.

### Decision

V1 will deploy the React/Vite frontend to Cloudflare Pages and the Hono API to a separate Cloudflare Worker.

Local development will also use separate processes:

- Vite for the frontend.
- Wrangler for the API Worker.

### Reason

The app is expected to have a full API separate from the frontend. Keeping the frontend and API as separate deployment targets makes each side easier to reason about, test, and evolve while staying fully on Cloudflare.

### Consequences

- The frontend needs an environment-configured API base URL.
- The API needs CORS and cookie/session settings compatible with the Pages frontend origin.
- Deployment automation needs to handle both Cloudflare Pages and the Worker.
