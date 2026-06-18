export type CreateMeasurementInput = {
  date: string
  weightKg: number
  bodyFatPercentage?: number | null
  musclePercentage?: number | null
  restingMetabolismKcal?: number | null
}

export type ImportedMeasurementInput = CreateMeasurementInput & {
  createdAt: string
  updatedAt: string
}

export type UpdateMeasurementByDateInput = {
  weightKg: number
  bodyFatPercentage?: number | null
  musclePercentage?: number | null
  restingMetabolismKcal?: number | null
}
