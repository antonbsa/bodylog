import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/index"
import {
  createSessionCookieValue,
  isValidSessionCookieValue,
  SESSION_COOKIE_NAME,
} from "../../apps/api/src/auth/session"

const env = {
  APP_PASSWORD: "correct-password",
  DB: {
    prepare(query: string) {
      return {
        bind() {
          return this
        },
        async all<T>(): Promise<D1Result<T>> {
          if (!query.includes("FROM measurements")) {
            throw new Error(`Unsupported all query: ${query}`)
          }

          return {
            results: [],
            success: true,
            meta: {
              changed_db: false,
              changes: 0,
              duration: 0,
              last_row_id: 0,
              rows_read: 0,
              rows_written: 0,
              size_after: 0,
            },
          } as D1Result<T>
        },
      }
    },
  } as unknown as D1Database,
  SESSION_SECRET: "test-session-secret",
  USER_HEIGHT_CM: "168",
  USER_TIME_ZONE: "America/Sao_Paulo",
}

describe("auth login", () => {
  it("rejects an invalid password with a clear error", async () => {
    const response = await app.request(
      "/api/auth/login",
      {
        body: JSON.stringify({ password: "wrong-password" }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      },
      env,
    )

    expect(response.status).toBe(401)
    expect(response.headers.get("set-cookie")).toBeNull()
    expect(await response.json()).toEqual({
      error: "INVALID_PASSWORD",
      ok: false,
    })
  })

  it("creates a signed session cookie for a valid password", async () => {
    const response = await app.request(
      "/api/auth/login",
      {
        body: JSON.stringify({ password: "correct-password" }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      },
      env,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
    })

    const setCookieHeader = response.headers.get("set-cookie")

    expect(setCookieHeader).toContain(`${SESSION_COOKIE_NAME}=`)
    expect(setCookieHeader).toContain("HttpOnly")
    expect(setCookieHeader).toContain("SameSite=Lax")

    const cookieValue = setCookieHeader?.match(
      new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`),
    )?.[1]

    expect(
      await isValidSessionCookieValue(cookieValue, env.SESSION_SECRET),
    ).toBe(true)
  })

  it("uses same-site production cookies for custom frontend and API domains", async () => {
    const response = await app.request(
      "https://api.bodylog.antonbsa.dev/api/auth/login",
      {
        body: JSON.stringify({ password: "correct-password" }),
        headers: {
          "content-type": "application/json",
          origin: "https://bodylog.antonbsa.dev",
        },
        method: "POST",
      },
      {
        ...env,
        FRONTEND_ORIGIN: "https://bodylog.antonbsa.dev",
      },
    )

    expect(response.status).toBe(200)

    const setCookieHeader = response.headers.get("set-cookie")

    expect(setCookieHeader).toContain(`${SESSION_COOKIE_NAME}=`)
    expect(setCookieHeader).toContain("HttpOnly")
    expect(setCookieHeader).toContain("Secure")
    expect(setCookieHeader).toContain("SameSite=Lax")
  })

  it("keeps cross-site production cookies compatible with separate Cloudflare default domains", async () => {
    const response = await app.request(
      "https://bodylog-api.antonbsa.workers.dev/api/auth/login",
      {
        body: JSON.stringify({ password: "correct-password" }),
        headers: {
          "content-type": "application/json",
          origin: "https://bodylog.pages.dev",
        },
        method: "POST",
      },
      {
        ...env,
        FRONTEND_ORIGIN: "https://bodylog.pages.dev",
      },
    )

    expect(response.status).toBe(200)

    const setCookieHeader = response.headers.get("set-cookie")

    expect(setCookieHeader).toContain(`${SESSION_COOKIE_NAME}=`)
    expect(setCookieHeader).toContain("HttpOnly")
    expect(setCookieHeader).toContain("Secure")
    expect(setCookieHeader).toContain("SameSite=None")
  })
})

describe("auth logout", () => {
  it("clears the session cookie", async () => {
    const response = await app.request(
      "/api/auth/logout",
      {
        method: "POST",
      },
      env,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
    })

    const setCookieHeader = response.headers.get("set-cookie")

    expect(setCookieHeader).toContain(`${SESSION_COOKIE_NAME}=`)
    expect(setCookieHeader).toContain("Max-Age=0")
    expect(setCookieHeader).toContain("HttpOnly")
    expect(setCookieHeader).toContain("SameSite=Lax")
  })
})

describe("auth session", () => {
  it("rejects requests without a valid session", async () => {
    const response = await app.request("/api/auth/session", {}, env)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      authenticated: false,
    })
  })

  it("confirms requests with a valid session", async () => {
    const sessionCookieValue = await createSessionCookieValue(
      env.SESSION_SECRET,
    )
    const response = await app.request(
      "/api/auth/session",
      {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${sessionCookieValue}`,
        },
      },
      env,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      authenticated: true,
    })
  })
})

describe("protected api routes", () => {
  const protectedRoutes = [
    "/api/measurements",
    "/api/measurements/by-date/2026-06-11",
    "/api/dashboard/weekly",
    "/api/export/csv",
    "/api/import/csv",
  ]

  it("rejects unauthenticated data-route requests", async () => {
    for (const path of protectedRoutes) {
      const response = await app.request(path, {}, env)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({
        error: "UNAUTHENTICATED",
        ok: false,
      })
    }
  })

  it("rejects data-route requests with an invalid session cookie", async () => {
    const response = await app.request(
      "/api/measurements",
      {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=invalid-session`,
        },
      },
      env,
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      error: "UNAUTHENTICATED",
      ok: false,
    })
  })

  it("allows authenticated data-route requests to continue to route handlers", async () => {
    const sessionCookieValue = await createSessionCookieValue(
      env.SESSION_SECRET,
    )
    const response = await app.request(
      "/api/measurements",
      {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${sessionCookieValue}`,
        },
      },
      env,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      items: [],
    })
  })

  it("keeps public api routes accessible without a session", async () => {
    const response = await app.request("/api/health")

    expect(response.status).toBe(200)
  })
})

describe("api cors", () => {
  it("allows local frontend origins for development", async () => {
    const response = await app.request(
      "/api/auth/session",
      {
        headers: {
          origin: "http://localhost:5173",
        },
      },
      env,
    )

    expect(response.status).toBe(401)
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:5173",
    )
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true",
    )
  })

  it("allows the configured production frontend origin", async () => {
    const response = await app.request(
      "/api/auth/session",
      {
        headers: {
          origin: "https://bodylog.pages.dev",
        },
      },
      {
        ...env,
        FRONTEND_ORIGIN: "https://bodylog.pages.dev",
      },
    )

    expect(response.status).toBe(401)
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://bodylog.pages.dev",
    )
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true",
    )
  })

  it("does not allow unrelated origins", async () => {
    const response = await app.request(
      "/api/auth/session",
      {
        headers: {
          origin: "https://example.com",
        },
      },
      {
        ...env,
        FRONTEND_ORIGIN: "https://bodylog.pages.dev",
      },
    )

    expect(response.status).toBe(401)
    expect(response.headers.get("access-control-allow-origin")).toBeNull()
    expect(response.headers.get("access-control-allow-credentials")).toBeNull()
  })

  it("responds to protected route preflight before auth", async () => {
    const response = await app.request(
      "/api/measurements",
      {
        headers: {
          "access-control-request-headers": "content-type",
          "access-control-request-method": "GET",
          origin: "https://bodylog.pages.dev",
        },
        method: "OPTIONS",
      },
      {
        ...env,
        FRONTEND_ORIGIN: "https://bodylog.pages.dev",
      },
    )

    expect(response.status).toBe(204)
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://bodylog.pages.dev",
    )
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true",
    )
    expect(response.headers.get("access-control-allow-methods")).toBe(
      "GET,POST,PUT,DELETE,OPTIONS",
    )
    expect(response.headers.get("access-control-allow-headers")).toBe(
      "content-type",
    )
  })
})
