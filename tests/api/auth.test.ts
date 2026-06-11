import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/index"
import {
  createSessionCookieValue,
  isValidSessionCookieValue,
  SESSION_COOKIE_NAME,
} from "../../apps/api/src/auth/session"

const env = {
  APP_PASSWORD: "correct-password",
  DB: {} as D1Database,
  SESSION_SECRET: "test-session-secret",
  USER_HEIGHT_CM: "168",
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

    expect(response.status).toBe(404)
  })

  it("keeps public api routes accessible without a session", async () => {
    const response = await app.request("/api/health")

    expect(response.status).toBe(200)
  })
})
