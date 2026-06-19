import type { MeasurementRepository } from "../measurements/measurement-repository"
import { createWeeklyComparison } from "../measurements/weekly-logic"
import type { WeeklyDashboard } from "../../../../types/dashboard"

type WeeklyDashboardRepository = Pick<MeasurementRepository, "list">

type WeeklyDashboardConfig = {
  currentDate: string
  heightCm: number
}

export async function getWeeklyDashboard(
  repository: WeeklyDashboardRepository,
  config: WeeklyDashboardConfig,
): Promise<WeeklyDashboard> {
  const measurements = await repository.list()

  return createWeeklyComparison(measurements, config)
}

export function getCurrentDateOnly(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(now)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) {
    throw new Error("Unable to derive current date for configured time zone")
  }

  return `${year}-${month}-${day}`
}
