import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/app"
import e2eApp from "../../apps/api/src/e2e"
import { createTestEnv } from "./test-env"

function postTestSession(
  target: { request: typeof app.request },
  env: object,
  body: unknown,
) {
  return target.request(
    "/api/test/session",
    {
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
      method: "POST",
    },
    env,
  )
}

function sessionCookie(response: Response) {
  return response.headers.get("set-cookie")?.split(";")[0] ?? ""
}

describe("POST /api/test/session", () => {
  it("answers 404 from the default app", async () => {
    const { env } = createTestEnv()
    const response = await postTestSession(app, env, {})

    expect(response.status).toBe(404)
  })

  it("creates a fresh signed-in user owning the given measurements", async () => {
    const { env } = createTestEnv()
    const response = await postTestSession(e2eApp, env, {
      measurements: [
        { date: "2026-06-09", weightKg: 72.6 },
        { bodyFatPercentage: 20, date: "2026-06-10", weightKg: 72 },
      ],
    })

    expect(response.status).toBe(200)

    const cookie = sessionCookie(response)
    const session = await e2eApp.request(
      "/api/auth/session",
      { headers: { cookie } },
      env,
    )
    const list = await e2eApp.request(
      "/api/measurements",
      { headers: { cookie } },
      env,
    )
    const { items } = (await list.json()) as {
      items: Array<{ bodyFatPercentage: number | null; date: string }>
    }

    expect(session.status).toBe(200)
    expect(items.map(({ date }) => date)).toEqual(["2026-06-10", "2026-06-09"])
    expect(items[0].bodyFatPercentage).toBe(20)
  })

  it("gives each call its own user", async () => {
    const { env } = createTestEnv()
    const first = await postTestSession(e2eApp, env, {
      measurements: [{ date: "2026-06-10", weightKg: 72 }],
    })
    const second = await postTestSession(e2eApp, env, {})
    const list = await e2eApp.request(
      "/api/measurements",
      { headers: { cookie: sessionCookie(second) } },
      env,
    )
    const firstUser = (await first.json()) as { user: { id: string } }
    const secondUser = (await second.json()) as { user: { id: string } }

    expect(firstUser.user.id).not.toBe(secondUser.user.id)
    expect(await list.json()).toEqual({ items: [] })
  })

  it.each([
    ["a bad date", [{ date: "10/06/2026", weightKg: "x" }], "Data inválida."],
    [
      "a bad body",
      [{ date: "2026-06-10", weightKg: "x" }],
      "Dados da medida inválidos.",
    ],
    [
      "a repeated date",
      [
        { date: "2026-06-10", weightKg: 72 },
        { date: "2026-06-10", weightKg: 73 },
      ],
      "Dados da medida inválidos.",
    ],
  ])("rejects %s with a 400 and creates nothing", async (_, items, message) => {
    const { env, sqlite } = createTestEnv()
    const response = await postTestSession(e2eApp, env, {
      measurements: [{ date: "2026-06-01", weightKg: 70 }, ...items],
    })
    const counts = sqlite
      .prepare(
        "SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM measurements) AS measurements",
      )
      .get()

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ message })
    expect(counts).toEqual({ measurements: 0, users: 0 })
  })

  it("rejects a JSON array body", async () => {
    const { env, sqlite } = createTestEnv()
    const response = await postTestSession(e2eApp, env, [])
    const { users } = sqlite
      .prepare("SELECT COUNT(*) AS users FROM users")
      .get() as { users: number }

    expect(response.status).toBe(400)
    expect(users).toBe(0)
  })

  it("rejects a body that is not JSON", async () => {
    const { env } = createTestEnv()
    const response = await e2eApp.request(
      "/api/test/session",
      { body: "not json", method: "POST" },
      env,
    )

    expect(response.status).toBe(400)
  })

  it("keeps the app's JSON 404 for unknown api paths", async () => {
    const { env } = createTestEnv()
    const response = await e2eApp.request("/api/x", {}, env)

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ name: "NotFoundError" })
  })
})
