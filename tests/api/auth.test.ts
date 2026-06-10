import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/index"
import {
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
