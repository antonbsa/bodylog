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

export async function login(password: string): Promise<LoginResult> {
  try {
    const response = await api("/api/auth/login", {
      body: JSON.stringify({ password }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })

    if (response.ok) {
      return { ok: true }
    }

    return {
      error: await parseApiError(response, {
        action: "Verifique a senha e tente novamente.",
        message: "Não foi possível entrar.",
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
