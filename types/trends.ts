/** One recorded day for the Tendências chart; every metric but the date can be missing. */
export type TrendPoint = {
  bmi: number | null
  bodyFatPercentage: number | null
  date: string
  disposition: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  sleepHours: number | null
  waistCm: number | null
  weightKg: number | null
}

/** Response of `GET /api/trends`: every measurement, oldest first. */
export type TrendsResponse = {
  points: TrendPoint[]
}
