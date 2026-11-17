# apps/web

Frontend conventions for the React/Vite PWA (react-router, TanStack Query, Radix Themes, Phosphor icons). User-visible text is Brazilian Portuguese.

## Component placement

- `src/screens/<Name>Screen.tsx` is one route's screen; `src/screens/components/` holds the BodyLog-specific pieces screens compose (cards, fields, sheets, tab bar).
- `src/components/` holds only app-agnostic primitives with no product knowledge (`Button`, `MaskedNumberInput`, `ToastProvider`).
- Pure logic (formatting, masks, form state, summaries) goes in `src/utils/`, where `tests/web` unit-tests it without a browser; a screen keeps only wiring.
- Styles are plain CSS per screen in `src/styles/`, with every color a custom property from `src/styles/tokens.css` in both light and dark.

## Data and server state

- HTTP calls live in `src/api/<resource>.ts` on top of `api()` from `api/client.ts` (same-origin `/api`, `no-store`), and turn error responses into `AppError`s with `throwApiError` from `infra/errors.ts`. Screens and hooks call these functions, never `fetch`.
- Reads go through TanStack Query (ADR 0037) with keys from `api/queryKeys.ts`, wrapped in a `src/hooks/use*.ts` hook when the screen needs more than one query's state; error text comes from `formatApiErrorMessage`.
- Symptom: after saving, deleting or importing, a screen keeps showing the old data until a reload. Why it slips: every screen renders correctly on its own and the e2e mocks return fresh data per request. Verify: a new query key starts with the `"measurements"` prefix (or is added to `invalidateMeasurementData`), and the write path awaits `invalidateMeasurementData(queryClient)`.
- Wire shapes come from root `types/`; `src/types.ts` only extends them for web-only views.

## Radix Themes

- The project tokens own the visuals and Radix Themes keeps behavior (ADR 0026, update section): new components use plain CSS with the tokens. Use Radix Themes only where it brings accessible behavior (`Dialog`, `AlertDialog`, `TextField`), styled through the tokens.
- The `<Theme>` in `main.tsx` follows the resolved theme and points Radix's gray and accent scales at the tokens in `styles.css`. Symptom: a Radix component looks right in one theme and clashes in the other. Why it slips: you usually check only the OS theme you're on. Verify the screen in Ajustes with both light and dark selected.
