# T-009 — Create Measurements Migration

## Status

Done

## Description


## Why
This task advances BodyLog V1 during the Database and Domain phase.
## Scope
Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.
## Out of Scope
Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.
## Validation
Run the relevant automated checks for the changed area. If automated coverage is not practical yet, record the manual validation performed in this task.


## Acceptance Criteria

- [x] `measurements` table created.
- [x] `date` field is unique.
- [x] `weight_kg` is required.
- [x] Optional fields are nullable.
- [x] Migration works locally and remotely.


## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
