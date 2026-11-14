import { throwApiError } from "../../../../infra/errors"
import { api } from "./client"
import type { TrendsResponse } from "../../../../types/trends"

export async function getTrends(): Promise<TrendsResponse> {
  const response = await api("/api/trends", { method: "GET" })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Atualize a página e tente novamente.",
      message: "Não foi possível carregar as tendências.",
    })
  }

  return (await response.json()) as TrendsResponse
}
