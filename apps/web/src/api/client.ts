export function api(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)

  headers.set("cache-control", "no-store")

  return fetch(url, {
    ...init,
    cache: init?.cache ?? "no-store",
    headers,
  })
}
