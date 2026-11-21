import {
  type ApiError,
  createFallbackApiError,
  parseApiError,
  throwApiError,
} from "../../../../infra/errors"
import { api } from "./client"

type LoginResult =
  | {
      ok: true
    }
  | {
      error: ApiError
      ok: false
    }

export async function checkSession(): Promise<boolean> {
  try {
    const response = await api("/api/auth/session", { method: "GET" })

    return response.ok
  } catch {
    return false
  }
}

/** Signs in as the local seed user; the API answers 404 outside `npm run dev`. */
export async function devLogin(): Promise<LoginResult> {
  try {
    const response = await api("/api/auth/dev-login", { method: "POST" })

    if (response.ok) {
      return { ok: true }
    }

    return {
      error: await parseApiError(response, {
        action: "Confira se a API local está rodando com o .env.development.",
        message: "Não foi possível entrar como dev.",
      }),
      ok: false,
    }
  } catch {
    return {
      error: createFallbackApiError({
        action: "Verifique sua conexão e tente novamente.",
        message: "Não foi possível entrar.",
      }),
      ok: false,
    }
  }
}

export async function logout(): Promise<void> {
  const response = await api("/api/auth/logout", { method: "POST" })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Entre novamente e tente sair mais uma vez.",
      message: "Não foi possível encerrar a sessão.",
    })
  }
}
