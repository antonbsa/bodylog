import type { MeasurementRepository } from "../measurements/measurement-repository"
import {
  createWeeklyComparison,
  type WeeklyComparison,
} from "../measurements/weekly-logic"

export type WeeklyDashboardRepository = Pick<MeasurementRepository, "list">

export type WeeklyDashboardConfig = {
  currentDate: string
  heightCm: number
}

export async function getWeeklyDashboard(
  repository: WeeklyDashboardRepository,
  config: WeeklyDashboardConfig,
): Promise<WeeklyComparison> {
  const measurements = await repository.list()

  return createWeeklyComparison(measurements, config)
}

export function getCurrentDateOnly(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}
