import { api } from "./client"
import type { WeeklyDashboard } from "../../../../types/dashboard"

export async function getWeeklyDashboard(): Promise<WeeklyDashboard> {
  const response = await api("/api/dashboard/weekly", { method: "GET" })

  if (!response.ok) {
    throw new Error("Weekly dashboard lookup failed")
  }

  return (await response.json()) as WeeklyDashboard
}
