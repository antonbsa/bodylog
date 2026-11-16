export const databaseBinding = "DB"
export const seedIdPrefix = "dev-seed:"

export type SeedMeasurement = {
  date: string
  weightKg: number
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
}

export type ExistingMeasurement = {
  date: string
  id: string
}
