import {
  type ApiError,
  createFallbackApiError,
  parseApiError,
  throwApiError,
} from "../../../../infra/errors"
import type {
  SessionResponse,
  SessionUser,
  UpdateProfileRequest,
} from "../../../../types/auth"
import { api } from "./client"

type LoginResult =
  | {
      ok: true
    }
  | {
      error: ApiError
      ok: false
    }

/** The signed-in user, or null when there is no live session or the request fails. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const response = await api("/api/auth/session", { method: "GET" })

    return response.ok
      ? ((await response.json()) as SessionResponse).user
      : null
  } catch {
    return null
  }
}

export async function updateProfile(
  update: UpdateProfileRequest,
): Promise<SessionUser> {
  const response = await api("/api/me", {
    body: JSON.stringify(update),
    headers: { "content-type": "application/json" },
    method: "PATCH",
  })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Verifique sua conexão e tente novamente.",
      message: "Não foi possível salvar o perfil.",
    })
  }

  return ((await response.json()) as SessionResponse).user
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
