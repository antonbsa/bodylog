const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

export function api(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)

  headers.set("cache-control", "no-store")

  return fetch(`${API_BASE_URL}${url}`, {
    ...init,
    cache: init?.cache ?? "no-store",
    credentials: "include",
    headers,
  })
}
