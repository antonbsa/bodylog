# Measurements

What a measurement is and the rules the app computes from it: fields, validation limits, derived values, weekly averages and comparison, and the CSV format. How it is stored (the table, its keys and its owner) is in [Database](database.md).

## Entity

A measurement represents the body metrics one user recorded for one date.

There is at most one measurement per date per user (`UNIQUE (user_id, date)`).

## Fields

| Field                   | Type        | Required | Description                                               |
| ----------------------- | ----------- | -------: | --------------------------------------------------------- |
| `id`                    | string      |      yes | Unique measurement identifier.                            |
| `userId`                | string      |      yes | Owning user; stored as `user_id`, not sent over the API.  |
| `date`                  | string      |      yes | Measurement date in `YYYY-MM-DD` format, unique per user. |
| `weightKg`              | number      |      yes | Body weight in kilograms.                                 |
| `bodyFatPercentage`     | number/null |       no | Body fat percentage from the scale.                       |
| `musclePercentage`      | number/null |       no | Muscle percentage from the scale.                         |
| `restingMetabolismKcal` | number/null |       no | Resting metabolism from the scale.                        |
| `waistCm`               | number/null |       no | Waist in centimeters, one decimal (30–250).               |
| `sleepHours`            | number/null |       no | Hours slept the previous night, one decimal (0–24).       |
| `disposition`           | number/null |       no | Integer from 1 (indisposto) to 5 (disposto).              |
| `notes`                 | string/null |       no | Free text, trimmed; blank notes are stored as `null`.     |
| `createdAt`             | string      |      yes | Creation timestamp.                                       |
| `updatedAt`             | string      |      yes | Last update timestamp.                                    |

Hard validation limits that block saving: weight 20–300 kg, body fat and muscle 1–80%, resting metabolism 500–5000 kcal, waist 30–250 cm, sleep 0–24 h, disposition integer 1–5 (`0032-add-waist-sleep-disposition-and-notes-fields.md`). The limits live in `domain/measurement.ts`.

## Derived Values

Derived values should be calculated by the application and are not stored.

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

The comparison is:

```txt
partial current week vs previous full week
```

The API returns weekly averages only; the UI computes the variation between the two weeks (`0039-compute-weekly-variation-in-the-ui.md`). Missing metrics in either week produce no comparison, never a zero.

For percentage-based metrics such as body fat percentage and muscle percentage, absolute variation must be displayed as percentage points.

Example:

```txt
16.20% → 14.46% = -1.74 percentage points
```

## CSV Format

Canonical CSV headers:

```txt
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,waist_cm,sleep_hours,disposition,notes,created_at,updated_at
```

CSV export uses this full canonical format and omits the internal `id` field. CSV import identifies columns by header name (the canonical names and the spreadsheet aliases), requires only `date` and `weight_kg`, and upserts the signed-in user's records by `date`; the format and the overwrite rules are in the [API contract](api-contract.md#csv-import).

Imported values are validated against the same limits as the form; dates must be real calendar dates, such as `2026-02-28` or `28/02/2026`, never `2026-02-30`.
