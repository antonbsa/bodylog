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
      action: "Verifique a senha configurada e tente novamente.",
      message: "Senha inválida.",
      name: "UnauthorizedError",
      statusCode: 401,
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

  it("marks the session cookie Secure and SameSite=Lax outside localhost", async () => {
    const response = await app.request(
      "https://bodylog.antonbsa.dev/api/auth/login",
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

    const setCookieHeader = response.headers.get("set-cookie")

    expect(setCookieHeader).toContain(`${SESSION_COOKIE_NAME}=`)
    expect(setCookieHeader).toContain("HttpOnly")
    expect(setCookieHeader).toContain("Secure")
    expect(setCookieHeader).toContain("SameSite=Lax")
  })

  it("leaves the session cookie non-Secure on localhost", async () => {
    const response = await app.request(
      "http://localhost:8787/api/auth/login",
      {
        body: JSON.stringify({ password: "correct-password" }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      },
      env,
    )

    const setCookieHeader = response.headers.get("set-cookie")

    expect(setCookieHeader).toContain("SameSite=Lax")
    expect(setCookieHeader).not.toContain("Secure")
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
      action: "Entre novamente para continuar.",
      message: "Sessão inválida ou expirada.",
      name: "UnauthorizedError",
      statusCode: 401,
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
        action: "Entre novamente para continuar.",
        message: "Sessão inválida ou expirada.",
        name: "UnauthorizedError",
        statusCode: 401,
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
      action: "Entre novamente para continuar.",
      message: "Sessão inválida ou expirada.",
      name: "UnauthorizedError",
      statusCode: 401,
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
    const response = await app.request("/api/health", {}, env)

    expect(response.status).toBe(200)
  })
})

describe("api cors", () => {
  it("emits no CORS headers, since the web app shares the API origin", async () => {
    const response = await app.request(
      "/api/auth/session",
      {
        headers: {
          origin: "http://localhost:5173",
        },
      },
      env,
    )

    expect(response.headers.get("access-control-allow-origin")).toBeNull()
    expect(response.headers.get("access-control-allow-credentials")).toBeNull()
  })
})
