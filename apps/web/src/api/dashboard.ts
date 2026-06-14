const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

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

export type WeeklyDashboard = {
  current: WeekSummary
  previous: WeekSummary
  variation: Partial<Record<keyof WeeklyAverages, MetricVariation>>
}

export async function getWeeklyDashboard(): Promise<WeeklyDashboard> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/weekly`, {
    credentials: "include",
    method: "GET",
  })

  if (!response.ok) {
    throw new Error("Weekly dashboard lookup failed")
  }

  return (await response.json()) as WeeklyDashboard
}
