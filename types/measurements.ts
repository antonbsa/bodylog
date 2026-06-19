export type Measurement = {
  id: string
  date: string
  weightKg: number
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  createdAt: string
  updatedAt: string
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
