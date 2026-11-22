import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { app } from "../../apps/api/src/app"
import { SESSION_COOKIE_NAME } from "../../apps/api/src/features/auth/session"
import { createTestEnv } from "./test-env"

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = new Date("2026-06-10T12:00:00.000Z")

const unauthorizedBody = {
  action: "Entre novamente para continuar.",
  message: "Sessão inválida ou expirada.",
  name: "UnauthorizedError",
  statusCode: 401,
}

function sessionCookieFrom(response: Response): string | undefined {
  return response.headers
    .get("set-cookie")
    ?.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]*)`))?.[1]
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("auth session", () => {
  it("rejects a request without a session cookie", async () => {
    const { env } = createTestEnv()
    const response = await app.request("/api/auth/session", {}, env)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(unauthorizedBody)
  })

  it("returns the signed-in user", async () => {
    const { createSession, env, sqlite } = createTestEnv()

    sqlite
      .prepare(
        "INSERT INTO users (id, display_name, email, created_at, updated_at) VALUES ('u1', 'Ana', 'ana@example.com', 't', 't')",
      )
      .run()

    const response = await app.request(
      "/api/auth/session",
      { headers: { cookie: await createSession("u1") } },
      env,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      user: { displayName: "Ana", email: "ana@example.com", id: "u1" },
    })
  })

  it("rejects an old signed cookie that matches no session row", async () => {
    const { env } = createTestEnv()
    const response = await app.request(
      "/api/auth/session",
      { headers: { cookie: `${SESSION_COOKIE_NAME}=1718000000000.signature` } },
      env,
    )

    expect(response.status).toBe(401)
  })

  it("deletes an expired session found on lookup and answers 401", async () => {
    const { createSession, createUser, env, sqlite } = createTestEnv()

    createUser("u1")
    const cookie = await createSession("u1", {
      expiresAt: new Date(NOW.getTime() - 1000),
    })
    const response = await app.request(
      "/api/auth/session",
      { headers: { cookie } },
      env,
    )

    expect(response.status).toBe(401)
    expect(sqlite.prepare("SELECT * FROM sessions").all()).toEqual([])
  })

  it("leaves a session with more than a week left untouched", async () => {
    const { createSession, createUser, env } = createTestEnv()

    createUser("u1")
    const cookie = await createSession("u1", {
      expiresAt: new Date(NOW.getTime() + 8 * DAY_MS),
    })
    const response = await app.request(
      "/api/auth/session",
      { headers: { cookie } },
      env,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toBeNull()
  })

  it("renews a session in its last week to 30 days from now and re-sends the cookie", async () => {
    const { createSession, createUser, env, sqlite } = createTestEnv()

    createUser("u1")
    const cookie = await createSession("u1", {
      expiresAt: new Date(NOW.getTime() + 6 * DAY_MS),
      sessionId: "renew-me",
    })
    const response = await app.request(
      "/api/auth/session",
      { headers: { cookie } },
      env,
    )

    expect(response.status).toBe(200)
    expect(sessionCookieFrom(response)).toBe("renew-me")
    expect(response.headers.get("set-cookie")).toContain(
      `Max-Age=${30 * 24 * 60 * 60}`,
    )
    expect(sqlite.prepare("SELECT expires_at FROM sessions").get()).toEqual({
      expires_at: new Date(NOW.getTime() + 30 * DAY_MS).toISOString(),
    })
  })

  it("caps a renewal at 180 days from sign-in", async () => {
    const { createSession, createUser, env, sqlite } = createTestEnv()
    const maxExpiresAt = new Date(NOW.getTime() + 10 * DAY_MS)

    createUser("u1")
    const cookie = await createSession("u1", {
      expiresAt: new Date(NOW.getTime() + 2 * DAY_MS),
      maxExpiresAt,
    })
    const response = await app.request(
      "/api/auth/session",
      { headers: { cookie } },
      env,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toContain(
      `Max-Age=${10 * 24 * 60 * 60}`,
    )
    expect(sqlite.prepare("SELECT expires_at FROM sessions").get()).toEqual({
      expires_at: maxExpiresAt.toISOString(),
    })
  })

  it("ends a session at its cap without renewing it", async () => {
    const { createSession, createUser, env } = createTestEnv()
    const capped = new Date(NOW.getTime() + DAY_MS)

    createUser("u1")
    const cookie = await createSession("u1", {
      expiresAt: capped,
      maxExpiresAt: capped,
    })
    const response = await app.request(
      "/api/auth/session",
      { headers: { cookie } },
      env,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toBeNull()

    vi.setSystemTime(new Date(capped.getTime() + 1000))

    expect(
      (await app.request("/api/auth/session", { headers: { cookie } }, env))
        .status,
    ).toBe(401)
  })
})

describe("auth logout", () => {
  it("deletes the session row, so replaying the old cookie answers 401", async () => {
    const { env, signIn, sqlite } = createTestEnv()
    const cookie = await signIn()
    const response = await app.request(
      "/api/auth/logout",
      { headers: { cookie }, method: "POST" },
      env,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
    expect(sqlite.prepare("SELECT * FROM sessions").all()).toEqual([])

    const replay = await app.request(
      "/api/measurements",
      { headers: { cookie } },
      env,
    )

    expect(replay.status).toBe(401)
  })

  it("clears the cookie even without a session", async () => {
    const { env } = createTestEnv()
    const response = await app.request(
      "/api/auth/logout",
      { method: "POST" },
      env,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toContain(
      `${SESSION_COOKIE_NAME}=;`,
    )
  })
})

describe("dev login", () => {
  it("answers 404 when DEV_LOGIN_ENABLED is not true", async () => {
    for (const flag of [undefined, "false", "1"]) {
      const { env } = createTestEnv(
        flag === undefined ? {} : { DEV_LOGIN_ENABLED: flag },
      )
      const response = await app.request(
        "/api/auth/dev-login",
        { method: "POST" },
        env,
      )

      expect(response.status).toBe(404)
      expect(response.headers.get("set-cookie")).toBeNull()
    }
  })

  it("signs in as the dev seed user, created once and reused", async () => {
    const { env, sqlite } = createTestEnv({ DEV_LOGIN_ENABLED: "true" })
    const first = await app.request(
      "/api/auth/dev-login",
      { method: "POST" },
      env,
    )
    const second = await app.request(
      "/api/auth/dev-login",
      { method: "POST" },
      env,
    )
    const firstBody = (await first.json()) as { user: { id: string } }

    expect(first.status).toBe(200)
    expect(firstBody).toEqual({
      user: { displayName: "Dev", email: null, id: expect.any(String) },
    })
    expect(await second.json()).toEqual(firstBody)
    expect(sqlite.prepare("SELECT * FROM user_identities").all()).toEqual([
      expect.objectContaining({
        provider: "dev",
        provider_user_id: "dev",
        user_id: firstBody.user.id,
      }),
    ])

    const session = await app.request(
      "/api/auth/session",
      {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${sessionCookieFrom(first)}`,
        },
      },
      env,
    )

    expect(await session.json()).toEqual(firstBody)
  })

  it("ends the session the browser already had when it signs in again", async () => {
    const { env, sqlite } = createTestEnv({ DEV_LOGIN_ENABLED: "true" })
    const first = await app.request(
      "/api/auth/dev-login",
      { method: "POST" },
      env,
    )
    const oldCookie = `${SESSION_COOKIE_NAME}=${sessionCookieFrom(first)}`

    await app.request(
      "/api/auth/dev-login",
      { headers: { cookie: oldCookie }, method: "POST" },
      env,
    )

    expect(sqlite.prepare("SELECT * FROM sessions").all()).toHaveLength(1)
    expect(
      (
        await app.request(
          "/api/auth/session",
          { headers: { cookie: oldCookie } },
          env,
        )
      ).status,
    ).toBe(401)
  })

  it("stores only the hash of the session id", async () => {
    const { env, sqlite } = createTestEnv({ DEV_LOGIN_ENABLED: "true" })
    const response = await app.request(
      "/api/auth/dev-login",
      { method: "POST" },
      env,
    )
    const sessionId = sessionCookieFrom(response)
    const row = sqlite.prepare("SELECT * FROM sessions").get() as Record<
      string,
      string
    >

    expect(sessionId).toMatch(/^[\w-]{43}$/)
    expect(row.id_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(row.id_hash).not.toContain(sessionId)
    expect(row.expires_at).toBe(
      new Date(NOW.getTime() + 30 * DAY_MS).toISOString(),
    )
    expect(row.max_expires_at).toBe(
      new Date(NOW.getTime() + 180 * DAY_MS).toISOString(),
    )
  })

  it("deletes expired sessions on each new sign-in", async () => {
    const { createSession, createUser, env, sqlite } = createTestEnv({
      DEV_LOGIN_ENABLED: "true",
    })

    createUser("other")
    await createSession("other", { expiresAt: new Date(NOW.getTime() - 1) })
    await createSession("other")

    await app.request("/api/auth/dev-login", { method: "POST" }, env)

    expect(
      sqlite.prepare("SELECT user_id FROM sessions ORDER BY user_id").all(),
    ).toHaveLength(2)
    expect(
      sqlite
        .prepare("SELECT COUNT(*) AS count FROM sessions WHERE expires_at <= ?")
        .get(NOW.toISOString()),
    ).toEqual({ count: 0 })
  })
})

describe("session cookie attributes", () => {
  it("is HttpOnly, Secure and SameSite=Lax outside localhost", async () => {
    const { env } = createTestEnv({ DEV_LOGIN_ENABLED: "true" })
    const response = await app.request(
      "https://bodylog.example/api/auth/dev-login",
      { method: "POST" },
      env,
    )
    const setCookie = response.headers.get("set-cookie")

    expect(setCookie).toContain("HttpOnly")
    expect(setCookie).toContain("Secure")
    expect(setCookie).toContain("SameSite=Lax")
    expect(setCookie).toContain("Path=/")
  })

  it("drops Secure on localhost", async () => {
    const { env } = createTestEnv({ DEV_LOGIN_ENABLED: "true" })
    const response = await app.request(
      "http://localhost:8787/api/auth/dev-login",
      { method: "POST" },
      env,
    )

    expect(response.headers.get("set-cookie")).not.toContain("Secure")
  })
})

describe("protected api routes", () => {
  const protectedRoutes: Array<[string, string]> = [
    ["GET", "/api/measurements"],
    ["GET", "/api/measurements/by-date/2026-06-11"],
    ["PUT", "/api/measurements/by-date/2026-06-11"],
    ["DELETE", "/api/measurements/some-id"],
    ["GET", "/api/dashboard/weekly"],
    ["GET", "/api/history/weeks"],
    ["GET", "/api/trends"],
    ["GET", "/api/export/csv"],
    ["POST", "/api/import/csv"],
    ["POST", "/api/import/csv/preview"],
  ]

  it("answers 401 without a session", async () => {
    const { env } = createTestEnv()

    for (const [method, path] of protectedRoutes) {
      const response = await app.request(path, { method }, env)

      expect(response.status, `${method} ${path}`).toBe(401)
      expect(await response.json()).toEqual(unauthorizedBody)
    }
  })

  it("answers 401 for a session whose row was deleted", async () => {
    const { env, signIn, sqlite } = createTestEnv()
    const cookie = await signIn()

    sqlite.prepare("DELETE FROM sessions").run()

    for (const [method, path] of protectedRoutes) {
      const response = await app.request(
        path,
        { headers: { cookie }, method },
        env,
      )

      expect(response.status, `${method} ${path}`).toBe(401)
    }
  })

  it("keeps the health route public", async () => {
    const { env } = createTestEnv()
    const response = await app.request("/api/health", {}, env)

    expect(response.status).toBe(200)
  })
})

describe("api cors", () => {
  it("emits no CORS headers, since the web app shares the API origin", async () => {
    const { env } = createTestEnv()
    const response = await app.request(
      "/api/auth/session",
      { headers: { origin: "http://localhost:5173" } },
      env,
    )

    expect(response.headers.get("access-control-allow-origin")).toBeNull()
    expect(response.headers.get("access-control-allow-credentials")).toBeNull()
  })
})
