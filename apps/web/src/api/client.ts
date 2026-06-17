const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

export function api(url: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${url}`, {
    ...init,
    credentials: "include",
  })
}
