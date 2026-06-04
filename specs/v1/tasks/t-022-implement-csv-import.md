# T-022 — Implement CSV Import

## Status

To Do

## Description


## Why
This task advances BodyLog V1 during the CSV Import phase.
## Scope
Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.
## Out of Scope
Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.
## Validation
Run the relevant automated checks for the changed area. If automated coverage is not practical yet, record the manual validation performed in this task.


## Acceptance Criteria

- [ ] Upload endpoint accepts CSV file.
- [ ] Headers are validated.
- [ ] Rows are validated.
- [ ] Records are upserted by date.
- [ ] Import summary is returned.
- [ ] Invalid rows are reported.
- [ ] UI has import action.
- [ ] Automated tests cover valid import, invalid rows, and upsert by date.


## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
