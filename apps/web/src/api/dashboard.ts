import { api } from "./client"

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
  display: {
    mode: "current-week" | "latest-recorded-week"
    summary: WeekSummary
    variation: Partial<Record<keyof WeeklyAverages, MetricVariation>>
  }
  previous: WeekSummary
  variation: Partial<Record<keyof WeeklyAverages, MetricVariation>>
}

export async function getWeeklyDashboard(): Promise<WeeklyDashboard> {
  const response = await api("/api/dashboard/weekly", { method: "GET" })

  if (!response.ok) {
    throw new Error("Weekly dashboard lookup failed")
  }

  return (await response.json()) as WeeklyDashboard
}
