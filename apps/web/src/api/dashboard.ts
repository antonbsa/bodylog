import { throwApiError } from "../../../../infra/errors"
import { api } from "./client"
import type { WeeklyDashboard } from "../../../../types/dashboard"

export async function getWeeklyDashboard(): Promise<WeeklyDashboard> {
  const response = await api("/api/dashboard/weekly", { method: "GET" })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Atualize a página e tente novamente.",
      message: "Não foi possível carregar o resumo semanal.",
    })
  }

  return (await response.json()) as WeeklyDashboard
}
