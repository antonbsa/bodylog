# T-010 — Implement Measurement Repository

## Status

Done

## Description

Implement the D1-backed repository for persisted measurement records.

## Implementation Plan

- Add measurement domain types for stored records and repository inputs.
- Add a D1 repository that owns SQL queries, parameter binding, and row-to-domain mapping.
- Support create, update by date, get by date, list by date descending, and delete by id.
- Add focused repository tests with an in-memory D1-compatible fake.
- Run API tests and typecheck.

## Why
This task advances BodyLog V1 during the Database and Domain phase.
## Scope
Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.
## Out of Scope
Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.
## Validation

- `npm run test:api`
- `npm run typecheck`


## Acceptance Criteria

- [x] Create measurement.
- [x] Update measurement by date.
- [x] Get measurement by date.
- [x] List measurements by date descending.
- [x] Delete measurement.
- [x] SQL is contained in repository layer.
- [x] Repository behavior is covered by automated tests or documented local D1 validation.

## Modified Files

- `apps/api/src/measurements/measurement-repository.ts`
- `apps/api/src/measurements/types.ts`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-010-implement-measurement-repository.md`
- `tests/api/measurement-repository.test.ts`


## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
