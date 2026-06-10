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

export type CreateMeasurementInput = {
  date: string
  weightKg: number
  bodyFatPercentage?: number | null
  musclePercentage?: number | null
  restingMetabolismKcal?: number | null
}

export type UpdateMeasurementByDateInput = {
  weightKg: number
  bodyFatPercentage?: number | null
  musclePercentage?: number | null
  restingMetabolismKcal?: number | null
}
