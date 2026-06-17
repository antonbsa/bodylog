import { api } from "./client"

export type LoginResult =
  | {
      ok: true
    }
  | {
      error: "INVALID_PASSWORD" | "UNKNOWN_ERROR"
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

    if (response.status === 401) {
      return {
        error: "INVALID_PASSWORD",
        ok: false,
      }
    }

    return {
      error: "UNKNOWN_ERROR",
      ok: false,
    }
  } catch {
    return {
      error: "UNKNOWN_ERROR",
      ok: false,
    }
  }
}

export async function logout(): Promise<void> {
  const response = await api("/api/auth/logout", { method: "POST" })

  if (!response.ok) {
    throw new Error("Logout request failed")
  }
}
