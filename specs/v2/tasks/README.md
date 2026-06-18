# V2 Tasks

This index is for quick navigation only. The task files remain the source of truth for status, scope, validation notes, and modified files.

Keep task filenames stable. Do not move completed tasks to another folder just to organize status.

## Remaining

- [T-029 — Refactor Backend to Domain Model](./t-029-refactor-backend-to-domain-model.md)

### Before the redesign

- [T-030 — API Status / Health / Not-Found Pages](./t-030-api-status-health-not-found-pages.md)
- [T-031 — Force Fresh Data on Every PWA Open](./t-031-force-fresh-data-on-pwa-open.md)
- [T-032 — Increase History Window to 30 Items](./t-032-increase-history-window-to-30.md)
- [T-033 — Restructure `infra/` Folder](./t-033-restructure-infra-folder.md)
- [T-034 — Reusable Confirmation Dialog (Delete + Logout)](./t-034-reusable-confirmation-dialog.md)
- [T-035 — Structured Error Handling](./t-035-structured-error-handling.md)

### The redesign

- [T-036 — Apply Design System Redesign](./t-036-apply-design-system-redesign.md)

### After the redesign

- [T-037 — Measurement Form Polish](./t-037-measurement-form-polish.md)
- [T-038 — Replace Callouts with Toast Notifications](./t-038-replace-callouts-with-toast-notifications.md)

The three groups are sequencing-sensitive and must run in order — all
before-redesign tasks (T-030…T-035), then the redesign (T-036), then the
after-redesign tasks (T-037, T-038) — to avoid conflicts over the same files.
Within the before-redesign group, T-035 (structured errors) builds on T-033
(`infra/errors/`), and T-038 consumes T-035's error shape and T-036's toast
styling. See `../implementation-plan.md`.
