import { throwApiError } from "../../../../infra/errors"
import type {
  ApiTokenListResponse,
  ApiTokenSummary,
  CreateApiTokenResponse,
} from "../../../../types/api-tokens"
import { api } from "./client"

export async function listApiTokens(): Promise<ApiTokenSummary[]> {
  const response = await api("/api/tokens", { method: "GET" })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Atualize a página e tente novamente.",
      message: "Não foi possível carregar os tokens.",
    })
  }

  return ((await response.json()) as ApiTokenListResponse).items
}

export async function createApiToken(
  name: string,
): Promise<CreateApiTokenResponse> {
  const response = await api("/api/tokens", {
    body: JSON.stringify({ name }),
    headers: { "content-type": "application/json" },
    method: "POST",
  })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Tente novamente.",
      message: "Não foi possível criar o token.",
    })
  }

  return (await response.json()) as CreateApiTokenResponse
}

export async function revokeApiToken(id: string): Promise<void> {
  const response = await api(`/api/tokens/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Tente novamente.",
      message: "Não foi possível revogar o token.",
    })
  }
}
