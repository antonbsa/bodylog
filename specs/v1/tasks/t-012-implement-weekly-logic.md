# T-012 — Implement Weekly Logic

## Status

To Do

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

- [ ] Week starts on Monday.
- [ ] Week ends on Sunday.
- [ ] Missing days are ignored.
- [ ] Missing metric values are ignored per metric.
- [ ] Weekly averages are calculated correctly.
- [ ] Current partial week is compared against previous full week.
- [ ] Percentage metrics use percentage points for absolute difference.
- [ ] Direction uses documented stable thresholds for weight, body fat mass, and muscle mass.
- [ ] Unit tests cover week boundaries, missing values, averages, stable thresholds, and comparison rules.


## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
