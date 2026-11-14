export type WeeklyAverages = {
  weightKg: number | null
  bmi: number | null
  bodyFatPercentage: number | null
  bodyFatKg: number | null
  musclePercentage: number | null
  muscleKg: number | null
  restingMetabolismKcal: number | null
  waistCm: number | null
  sleepHours: number | null
  disposition: number | null
}

export type WeekSummary = {
  weekStartDate: string
  weekEndDate: string
  measurementCount: number
  recordedDates: string[]
  isCurrentWeek: boolean
  isPartialWeek: boolean
  averages: WeeklyAverages
}

export type WeeklyDashboard = {
  current: WeekSummary
  previous: WeekSummary
}
