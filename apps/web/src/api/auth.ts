const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

export type LoginResult =
  | {
      ok: true
    }
  | {
      error: "INVALID_PASSWORD" | "UNKNOWN_ERROR"
      ok: false
    }

export async function login(password: string): Promise<LoginResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      body: JSON.stringify({ password }),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
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
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    credentials: "include",
    method: "POST",
  })

  if (!response.ok) {
    throw new Error("Logout request failed")
  }
}
