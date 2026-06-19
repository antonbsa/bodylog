import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/index"

const env = {
  DB: {
    prepare: () => {
      throw new Error("Root liveness route must not query D1")
    },
  } as unknown as D1Database,
}

describe("api base", () => {
  it("responds to the public root route with a liveness response", async () => {
    const response = await app.request("/", {}, env)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
    })
  })

  it("does not emit the old api identity header", async () => {
    const response = await app.request(
      "/api/auth/session",
      {},
      {
        ...env,
        APP_PASSWORD: "correct-password",
        SESSION_SECRET: "test-session-secret",
        USER_HEIGHT_CM: "168",
        USER_TIME_ZONE: "America/Sao_Paulo",
      },
    )

    expect(response.headers.get("x-bodylog-api")).toBeNull()
  })
})
