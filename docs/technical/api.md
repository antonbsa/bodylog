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
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

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
  "restingMetabolismKcal": 1700
}
```

#### Rules

- `weightKg` is required.
- Other fields accept `number` or `null`.
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

Returns the weekly summary for the current week and comparison against the previous week.

The response must include week date ranges and measurement counts so the UI can derive current and previous week registration reliability.

#### Response 200

```json
{
  "current": {
    "weekStartDate": "YYYY-MM-DD",
    "weekEndDate": "YYYY-MM-DD",
    "measurementCount": 4,
    "isCurrentWeek": true,
    "isPartialWeek": true,
    "averages": {
      "weightKg": 72.9,
      "bmi": 25.83,
      "bodyFatPercentage": 14.46,
      "bodyFatKg": 10.54,
      "musclePercentage": 43.72,
      "muscleKg": 31.87,
      "restingMetabolismKcal": 1700
    }
  },
  "display": {
    "mode": "current-week",
    "summary": {
      "weekStartDate": "YYYY-MM-DD",
      "weekEndDate": "YYYY-MM-DD",
      "measurementCount": 4,
      "isCurrentWeek": true,
      "isPartialWeek": true,
      "averages": {
        "weightKg": 72.9,
        "bmi": 25.83,
        "bodyFatPercentage": 14.46,
        "bodyFatKg": 10.54,
        "musclePercentage": 43.72,
        "muscleKg": 31.87,
        "restingMetabolismKcal": 1700
      }
    },
    "variation": {
      "weightKg": {
        "absolute": 1.15,
        "relativePercentage": 1.6,
        "direction": "up"
      }
    }
  },
  "previous": {
    "weekStartDate": "YYYY-MM-DD",
    "weekEndDate": "YYYY-MM-DD",
    "measurementCount": 7,
    "averages": {
      "weightKg": 71.75,
      "bmi": 25.42,
      "bodyFatPercentage": 16.2,
      "bodyFatKg": 11.62,
      "musclePercentage": 42.75,
      "muscleKg": 30.67,
      "restingMetabolismKcal": 1680
    }
  },
  "variation": {
    "weightKg": {
      "absolute": 1.15,
      "relativePercentage": 1.6,
      "direction": "up"
    },
    "bodyFatPercentage": {
      "absolutePercentagePoints": -1.74,
      "relativePercentage": -10.74,
      "direction": "down"
    }
  }
}
```

`current` always represents the actual current week in the configured user time
zone. `display` provides the summary values the dashboard cards should render:
it uses the current week when it has records and falls back to the latest
recorded week when the current week is still empty.

## CSV Export

### GET /api/export/csv

Downloads all measurements as CSV.

#### Response 200

```csv
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,created_at,updated_at
2026-06-10,72.9,14.46,43.72,1700,2026-06-09T12:00:00.000Z,2026-06-09T12:00:00.000Z
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
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,created_at,updated_at
```

Minimal canonical format:

```txt
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal
```

#### Rules

- Validates headers exactly against supported canonical formats.
- Validates each row.
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
