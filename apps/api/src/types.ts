export type AppBindings = {
  APP_PASSWORD: string
  DB: D1Database
  SESSION_SECRET: string
  USER_HEIGHT_CM: string
  USER_TIME_ZONE: string
}

export type CreateMeasurementInput = {
  date: string
  weightKg: number
  bodyFatPercentage?: number | null
  musclePercentage?: number | null
  restingMetabolismKcal?: number | null
  waistCm?: number | null
  sleepHours?: number | null
  disposition?: number | null
  notes?: string | null
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
  waistCm?: number | null
  sleepHours?: number | null
  disposition?: number | null
  notes?: string | null
}

export type AppEnv = {
  Bindings: AppBindings
}
