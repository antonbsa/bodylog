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

export type CsvImportRowError = {
  message: string
  row: number
}

export type CsvImportSummary = {
  created: number
  errors: CsvImportRowError[]
  skipped: number
  updated: number
}
