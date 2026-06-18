# BodyLog V2 Open Questions

All open questions raised while planning the V2 Phase 2 tasks (T-030…T-038)
have been answered by the owner. The decisions are recorded directly in each
task's `## Assumptions` section (marked "confirmed by the owner") rather than
in a separate open-questions file — there are no remaining open items for these
tasks.

Notable decisions, for quick reference:

- **T-030:** `GET /` returns `{ d1: boolean, health: string }`; `/`, `/health`,
  and `/health/d1` are fully public; not-found page is a default "404 Not
  Found" screen with a single button back to `/`.
- **T-031:** proceed with the refetch-on-open/resume strategy, plus a manual
  "refresh data" fallback button.
- **T-033:** keep current package-script names; additionally audit and extract
  genuinely shared types (e.g. `Measurement`) into a single typechecked
  location both `apps/api` and `apps/web` import from.
- **T-034:** component named `ConfirmationDialog`.
- **T-035:** structured errors fully replace the old ad hoc shapes (no
  backward-compatibility constraint, no release shipped yet); error module
  source lives directly in `infra/errors/`.
- **T-036:** keep current component files, Phosphor Icons (no Lucide/Feather
  migration), self-hosted fonts, copied token values (not a package
  dependency), dark theme only; mobile history-table column trimming + detail
  view is in scope here (not covered elsewhere).
- **T-037:** "Nubank character fill" is the right-to-left masked numeric input
  pattern (append → pad → format); persisted form state lives in an in-memory
  app-level store; zoom prevention proceeds as originally assumed.
- **T-038:** use Radix's `@radix-ui/react-toast` primitive; toast durations and
  error-detail exposure proceed as originally assumed.
