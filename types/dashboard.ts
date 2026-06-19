export type MetricDirection = "up" | "down" | "stable"

export type WeeklyAverages = {
  weightKg: number | null
  bmi: number | null
  bodyFatPercentage: number | null
  bodyFatKg: number | null
  musclePercentage: number | null
  muscleKg: number | null
  restingMetabolismKcal: number | null
}

export type WeekSummary = {
  weekStartDate: string
  weekEndDate: string
  measurementCount: number
  isCurrentWeek: boolean
  isPartialWeek: boolean
  averages: WeeklyAverages
}

export type MetricVariation = {
  absolute?: number
  absolutePercentagePoints?: number
  relativePercentage: number | null
  direction: MetricDirection | null
}

export type WeeklyDisplayMode = "current-week" | "latest-recorded-week"

export type WeeklyDisplaySummary = {
  mode: WeeklyDisplayMode
  summary: WeekSummary
  variation: Partial<Record<keyof WeeklyAverages, MetricVariation>>
}

export type WeeklyDashboard = {
  current: WeekSummary
  display: WeeklyDisplaySummary
  previous: WeekSummary
  variation: Partial<Record<keyof WeeklyAverages, MetricVariation>>
}
