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

/** A valid import row; `fields` holds only the columns present in the file, where null clears the stored value. */
export type ImportedMeasurementRow = {
  createdAt?: string
  date: string
  fields: Omit<UpdateMeasurementByDateInput, "weightKg">
  updatedAt: string
  weightKg: number
}
