export type Measurement = {
  id: string
  date: string
  weightKg: number
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  waistCm: number | null
  sleepHours: number | null
  disposition: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** Response of `GET /api/measurements/by-date/:date`; height lets the form recompute derived values. */
export type MeasurementLookup = {
  heightCm: number
  item: Measurement
}

export type MeasurementInput = {
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  waistCm: number | null
  sleepHours: number | null
  disposition: number | null
  notes: string | null
  weightKg: number
}

export type MeasurementDerivedValues = {
  bmi: number
  bodyFatKg: number | null
  muscleKg: number | null
}

/** One invalid cell of an import file; `row` counts records with the header as row 1 and `column` is the header as written in the file. */
export type CsvImportRowError = {
  column: string
  message: string
  row: number
  value: string
}

/** Response of `POST /api/import/csv/preview`: what the import would do, with nothing written. */
export type CsvImportPreview = {
  counts: {
    created: number
    /** Rows counted once, while `invalidRows` has one entry per invalid cell. */
    invalid: number
    noMeasurement: number
    updated: number
  }
  ignoredColumns: string[]
  invalidRows: CsvImportRowError[]
  /** First and last valid date; null when no row is valid. */
  period: { from: string; to: string } | null
  updatedDates: string[]
}

/** Response of `POST /api/import/csv`. */
export type CsvImportResult = {
  created: number
  skippedInvalid: number
  updated: number
}
