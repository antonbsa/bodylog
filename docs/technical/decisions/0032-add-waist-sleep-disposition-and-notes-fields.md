# 0032 — Add Waist, Sleep, Disposition and Notes Fields

## Status

Accepted

## Context

The owner tracks more than the scale reports. Waist, the previous night's sleep, how disposed they feel and free notes give context to the weekly numbers. Daily notes were a future idea, and `0009-require-only-weight-v1.md` keeps weight as the only required field.

## Decision

Add four optional fields to a measurement:

- `waistCm`: waist in centimeters, one decimal;
- `sleepHours`: hours slept the previous night, one decimal (the UI steps by 0.5 h);
- `disposition`: integer from 1 to 5, where 1 is indisposto and 5 is disposto;
- `notes`: free text.

Hard validation limits that block saving: weight 20–300 kg, body fat and muscle 1–80%, resting metabolism 500–5000 kcal, waist 30–250 cm, sleep 0–24 h, disposition 1–5.

Weekly averages and the week-over-week comparison include waist, sleep and disposition, with neutral variation (see `0031-use-neutral-variation-color.md`). Notes appear only in Histórico (as an icon) and in the registration screen.

## Consequences

Needs a D1 migration, shared types in the root `types/` package, API validation, and CSV export/import support for the new columns. Existing records keep these fields empty.

`docs/product/requirements.md` and `docs/product/scope.md` list the new fields.
