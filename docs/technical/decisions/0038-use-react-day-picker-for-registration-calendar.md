# 0038 — Use react-day-picker for the Registration Calendar

## Status

Accepted

## Context

The registration date was picked with a native `input type="date"` laid over the date label. No browser lets a native picker mark days, so there was no way to show which dates already have a measurement.

## Decision

Replace the native picker with a calendar in a bottom sheet. The calendar is `react-day-picker` v9 (pt-BR locale, weeks starting on Monday, future days disabled) and the sheet is the Radix `Dialog` from `@radix-ui/themes`, which already provides the focus trap, Escape, scrim click and focus return. Recorded days come from the existing `GET /api/measurements?from=&to=` endpoint, fetched per displayed month through TanStack Query under the `measurements` key prefix, so saves, deletes and imports refresh the marks through the existing invalidation. Registro prefetches the current date's month so the marks are there when the sheet opens. Choosing a day goes through the same unsaved-changes check as the date arrows.

## Alternatives considered

Keeping the native picker without marks, rejected because marking recorded days is the goal. A hand-written calendar, rejected because month navigation, keyboard support and accessible labels are already solved by the library.

## Consequences

New runtime dependency in `apps/web`. The picker no longer looks native and is styled from the project tokens in `apps/web/src/styles/calendar.css`. Marks depend on a successful month lookup; when it fails the calendar still works, without marks.
