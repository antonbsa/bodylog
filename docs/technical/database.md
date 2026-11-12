# Data Model

## Entity: Measurement

A measurement represents the body metrics recorded for one date.

V1 allows at most one measurement per date.

## Fields

| Field                   | Type        | Required | Description                                              |
| ----------------------- | ----------- | -------: | -------------------------------------------------------- |
| `id`                    | string      |      yes | Unique measurement identifier.                           |
| `date`                  | string      |      yes | Measurement date in `YYYY-MM-DD` format. Must be unique. |
| `weightKg`              | number      |      yes | Body weight in kilograms.                                |
| `bodyFatPercentage`     | number/null |       no | Body fat percentage from the scale.                      |
| `musclePercentage`      | number/null |       no | Muscle percentage from the scale.                        |
| `restingMetabolismKcal` | number/null |       no | Resting metabolism from the scale.                       |
| `waistCm`               | number/null |       no | Waist in centimeters, one decimal (30–250).              |
| `sleepHours`            | number/null |       no | Hours slept the previous night, one decimal (0–24).      |
| `disposition`           | number/null |       no | Integer from 1 (indisposto) to 5 (disposto).             |
| `notes`                 | string/null |       no | Free text, trimmed; blank notes are stored as `null`.    |
| `createdAt`             | string      |      yes | Creation timestamp.                                      |
| `updatedAt`             | string      |      yes | Last update timestamp.                                   |

Hard validation limits that block saving: weight 20–300 kg, body fat and muscle 1–80%, resting metabolism 500–5000 kcal, waist 30–250 cm, sleep 0–24 h, disposition integer 1–5 (`0032-add-waist-sleep-disposition-and-notes-fields.md`). The limits live in `apps/api/src/domain/measurement.ts`.

## Derived Values

Derived values should be calculated by the application and do not need to be stored in V1.

### BMI

```txt
BMI = weightKg / (heightM * heightM)
```

`heightM` is derived from the API `USER_HEIGHT_CM` environment variable by converting centimeters to meters. Height should be configured outside the measurement record.

### Body Fat Mass

```txt
bodyFatKg = weightKg * bodyFatPercentage / 100
```

Only available when `bodyFatPercentage` is present.

### Muscle Mass

```txt
muscleKg = weightKg * musclePercentage / 100
```

Only available when `musclePercentage` is present.

## Weekly Grouping

Weeks start on Monday and end on Sunday.

Each measurement belongs to exactly one week based on its `date`.

## Weekly Average Rules

- Only existing measurements are included.
- Missing days are ignored.
- Missing optional values are ignored for that specific metric.
- A metric average should be `null` when no values are available for that metric.
- Waist, sleep and disposition are averaged like the other optional metrics.
- Each week also lists the `recordedDates` (ascending) that have a measurement; `measurementCount` is their count. The weekly registration target is 7 (`0035-use-seven-day-weekly-target.md`).

Example:

```txt
If a week has 4 weight values and 2 body fat values:
- weight average uses 4 values;
- body fat average uses 2 values.
```

## Weekly Comparison Rules

The V1 compares:

```txt
partial current week vs previous full week
```

The comparison should include:

- absolute variation;
- relative percentage variation when a previous value exists;
- direction: `up`, `down`, or `stable`.

Waist (cm), sleep (h) and disposition (points) are compared with a neutral variation: `absolute` in the metric's own unit and the relative percentage. They have no stable threshold in the API (direction is `stable` only when the averages are equal); the display threshold is a UI rule. A metric missing in either week has no entry in the variation, never a zero. Resting metabolism and derived values are not part of the redesign's additions.

For percentage-based metrics such as body fat percentage and muscle percentage, absolute variation must be displayed as percentage points.

Example:

```txt
16.20% → 14.46% = -1.74 percentage points
```

## Direction Rule

V1 stable thresholds:

- weight: less than `0.5 kg`;
- body fat mass: less than `0.4 kg`;
- muscle mass: less than `0.3 kg`.

Direction rules:

- `up`: current value is greater than previous value by at least the relevant threshold;
- `down`: current value is lower than previous value by at least the relevant threshold;
- `stable`: absolute change is below the relevant threshold.

Weight direction uses average weight in kg. Body fat and muscle direction use derived mass in kg for threshold evaluation, while percentage values still display percentage-point variation.

## Future Postgres Portability

V1 uses Cloudflare D1. Because V2 plans a migration to serverless Postgres, the application should avoid direct database access scattered across HTTP handlers.

Recommendation:

- handlers call services/use cases;
- services call repositories;
- repositories contain SQL and D1 details;
- domain types should not depend on D1-specific types.

## Suggested Initial SQL

```sql
CREATE TABLE measurements (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  weight_kg REAL NOT NULL,
  body_fat_percentage REAL,
  muscle_percentage REAL,
  resting_metabolism_kcal INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_measurements_date ON measurements(date);
```

Migration `0002_add_waist_sleep_disposition_notes.sql` adds the four nullable columns; existing rows keep them empty:

```sql
ALTER TABLE measurements ADD COLUMN waist_cm REAL;
ALTER TABLE measurements ADD COLUMN sleep_hours REAL;
ALTER TABLE measurements ADD COLUMN disposition INTEGER;
ALTER TABLE measurements ADD COLUMN notes TEXT;
```

## CSV Format

Canonical CSV headers:

```txt
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,waist_cm,sleep_hours,disposition,notes,created_at,updated_at
```

CSV export uses this full canonical format and omits the internal `id` field.
CSV import also accepts files without the four new columns (the earlier format) and without the audit timestamps. CSV import should upsert records by `date`; `created_at` and `updated_at` may be
used as backup metadata when present but should not be required for spreadsheet
import compatibility.

CSV import validates `date` as a real `YYYY-MM-DD` calendar date, not only as a
string shape. Impossible dates such as `2026-02-30` are rejected.

Numeric values may use dot decimals. Decimal-comma values are accepted only when
quoted as CSV cells, such as `"71,5"`.

Alternative headers from the current spreadsheet can be mapped later if needed.
