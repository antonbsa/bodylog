export type AppBindings = {
  DB: D1Database
  /** Enables `POST /api/auth/dev-login`; set to "true" only in `.env.development`. */
  DEV_LOGIN_ENABLED?: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
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
  Variables: {
    /** Set by `requireSession` for every protected route. */
    userId: string
  }
}

/** A valid import row; `fields` holds only the columns present in the file, where null clears the stored value. */
export type ImportedMeasurementRow = {
  createdAt?: string
  date: string
  fields: Omit<UpdateMeasurementByDateInput, "weightKg">
  updatedAt: string
  weightKg: number
}
