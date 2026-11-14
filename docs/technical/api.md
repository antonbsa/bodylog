# API Contract

## Base Rules

All data routes require authentication.

## Status

### GET /

Returns the public API liveness response. This endpoint confirms the Worker can
respond; it does not check database connectivity.

#### Response 200

```json
{
  "ok": true
}
```

---

## Auth

### POST /api/auth/login

Authenticates the single user.

#### Request

```json
{
  "password": "string"
}
```

#### Response 200

```json
{
  "ok": true
}
```

#### Response 401

```json
{
  "ok": false,
  "error": "INVALID_PASSWORD"
}
```

---

### POST /api/auth/logout

Ends the session.

#### Response 200

```json
{
  "ok": true
}
```

---

### GET /api/auth/session

Checks the current session.

#### Response 200

```json
{
  "authenticated": true
}
```

#### Response 401

```json
{
  "authenticated": false
}
```

## Measurements

### GET /api/measurements

Lists measurements.

#### Optional query params

```txt
from=YYYY-MM-DD
to=YYYY-MM-DD
limit=number
offset=number
```

#### Response 200

```json
{
  "items": [
    {
      "id": "string",
      "date": "YYYY-MM-DD",
      "weightKg": 72.9,
      "bodyFatPercentage": 14.46,
      "musclePercentage": 43.72,
      "restingMetabolismKcal": 1700,
      "waistCm": 80.5,
      "sleepHours": 7.5,
      "disposition": 4,
      "notes": "string or null",
      "derived": {
        "bmi": 25.83,
        "bodyFatKg": 10.54,
        "muscleKg": 31.87
      },
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

---

### GET /api/measurements/by-date/:date

Finds a measurement by date.

#### Response 200

```json
{
  "item": {
    "id": "string",
    "date": "YYYY-MM-DD",
    "weightKg": 72.9,
    "bodyFatPercentage": null,
    "musclePercentage": null,
    "restingMetabolismKcal": null,
    "waistCm": null,
    "sleepHours": null,
    "disposition": null,
    "notes": null,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "heightCm": 168
}
```

`heightCm` is the configured user height, so the registration screen can recompute the BMI live while editing.

#### Response 404

```json
{
  "item": null
}
```

---

### PUT /api/measurements/by-date/:date

Creates or updates the measurement for a date.

#### Request

```json
{
  "weightKg": 72.9,
  "bodyFatPercentage": 14.46,
  "musclePercentage": 43.72,
  "restingMetabolismKcal": 1700,
  "waistCm": 80.5,
  "sleepHours": 7.5,
  "disposition": 4,
  "notes": "Slept well"
}
```

#### Rules

- `weightKg` is required.
- Other fields accept `number` or `null` (`notes` accepts a string or `null`); an omitted field is stored as `null`.
- Values outside the limits are rejected with the `INVALID_MEASUREMENT_INPUT` validation error (400): weight 20–300 kg, `bodyFatPercentage` and `musclePercentage` 1–80, `restingMetabolismKcal` 500–5000, `waistCm` 30–250, `sleepHours` 0–24, `disposition` an integer 1–5.
- `notes` is trimmed; a blank string after trimming is stored as `null`.
- If the date already exists, update it.
- If the date does not exist, create it.

#### Response 200

```json
{
  "item": {
    "id": "string",
    "date": "YYYY-MM-DD",
    "weightKg": 72.9,
    "bodyFatPercentage": 14.46,
    "musclePercentage": 43.72,
    "restingMetabolismKcal": 1700,
    "waistCm": 80.5,
    "sleepHours": 7.5,
    "disposition": 4,
    "notes": "Slept well",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

---

### DELETE /api/measurements/:id

Deletes a measurement.

#### Response 200

```json
{
  "ok": true
}
```

## Dashboard

### GET /api/dashboard/weekly

Returns the weekly summaries of the current week and the previous week.

The response must include week date ranges and measurement counts so the UI can show the weekly registration count against the 7-day target.

Each week also returns its `recordedDates` (ascending `YYYY-MM-DD`) so the UI can draw the day dots; `measurementCount` is the recorded count. The weekly registration target is 7 (`0035-use-seven-day-weekly-target.md`) and the response carries no reliability label. Weekly averages include `waistCm`, `sleepHours` and `disposition`. The API returns raw averages and counts only; the UI computes variation (`0039-compute-weekly-variation-in-the-ui.md`).

#### Response 200

```json
{
  "current": {
    "weekStartDate": "YYYY-MM-DD",
    "weekEndDate": "YYYY-MM-DD",
    "measurementCount": 4,
    "recordedDates": ["YYYY-MM-DD"],
    "isCurrentWeek": true,
    "isPartialWeek": true,
    "averages": {
      "weightKg": 72.9,
      "bmi": 25.83,
      "bodyFatPercentage": 14.46,
      "bodyFatKg": 10.54,
      "musclePercentage": 43.72,
      "muscleKg": 31.87,
      "restingMetabolismKcal": 1700,
      "waistCm": 80.5,
      "sleepHours": 7.5,
      "disposition": 4
    }
  },
  "previous": {
    "weekStartDate": "YYYY-MM-DD",
    "weekEndDate": "YYYY-MM-DD",
    "measurementCount": 7,
    "recordedDates": ["YYYY-MM-DD"],
    "averages": {
      "weightKg": 71.75,
      "bmi": 25.42,
      "bodyFatPercentage": 16.2,
      "bodyFatKg": 11.62,
      "musclePercentage": 42.75,
      "muscleKg": 30.67,
      "restingMetabolismKcal": 1680,
      "waistCm": 82,
      "sleepHours": 7,
      "disposition": 3
    }
  }
}
```

`current` always represents the actual current week in the configured user time zone, even when it has no records yet; the web UI reads `current` and `previous` only.

## CSV Export

### GET /api/export/csv

Downloads all measurements as CSV.

#### Response 200

```csv
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,waist_cm,sleep_hours,disposition,notes,created_at,updated_at
2026-06-10,72.9,14.46,43.72,1700,80.5,7.5,4,Slept well,2026-06-09T12:00:00.000Z,2026-06-09T12:00:00.000Z
```

#### Rules

- Includes all measurements ordered by date descending.
- Includes raw measurement fields and audit timestamps.
- Does not include internal database identifiers.
- Empty optional values are exported as empty cells.

## CSV Import

### POST /api/import/csv

Imports measurements from CSV.

#### Request

Multipart upload containing a CSV file in a `file` field.

#### Supported Headers

Full canonical format:

```txt
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,waist_cm,sleep_hours,disposition,notes,created_at,updated_at
```

Minimal canonical format:

```txt
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,waist_cm,sleep_hours,disposition,notes
```

Files exported before the redesign, without `waist_cm,sleep_hours,disposition,notes`, still import (with or without `created_at,updated_at`); the new fields are stored as `null`.

#### Rules

- Validates headers exactly against supported canonical formats.
- Validates each row, including the limits of every numeric field; an invalid new value is reported per row (for example `Invalid waist`, `Invalid sleep hours`, `Invalid disposition`).
- Trims `notes`; blank notes are stored as `null`. Notes with commas or line breaks must be quoted.
- Upserts records by `date`.
- Uses the current import timestamp when `created_at` or `updated_at` are
  omitted or empty.
- Returns an import summary.
- Reports invalid rows without importing those rows.

#### Response 200

Returned when at least one row was imported. The `errors` array may still
contain row-level validation errors for skipped rows.

```json
{
  "created": 10,
  "updated": 5,
  "skipped": 1,
  "errors": [
    {
      "row": 7,
      "message": "Invalid weight value"
    }
  ]
}
```

#### Response 400

Returned when the request is invalid or CSV validation imports no rows.

```json
{
  "ok": false,
  "created": 0,
  "updated": 0,
  "skipped": 1,
  "errors": [
    {
      "row": 1,
      "message": "Invalid CSV headers"
    }
  ]
}
```

#### Numeric Format

- Dot decimals are accepted, for example `71.5`.
- Decimal-comma values are accepted only when they are valid CSV cells, for
  example `"71,5"`.
- Unquoted decimal-comma values are rejected because they break the CSV column
  structure.
