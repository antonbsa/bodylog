import { throwApiError } from "../../../../infra/errors"
import { api } from "./client"
import type { HistoryWeeksPage } from "../../../../types/history"

export async function getHistoryWeeks(
  before?: string,
): Promise<HistoryWeeksPage> {
  const query = before ? `?${new URLSearchParams({ before })}` : ""
  const response = await api(`/api/history/weeks${query}`, { method: "GET" })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Atualize a página e tente novamente.",
      message: "Não foi possível carregar o histórico.",
    })
  }

  return (await response.json()) as HistoryWeeksPage
}
