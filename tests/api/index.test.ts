import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/app"

const env = {
  DB: {
    prepare: () => {
      throw new Error("Health route must not query D1")
    },
  } as unknown as D1Database,
}

describe("api base", () => {
  it("responds to the public health route with a liveness response", async () => {
    const response = await app.request("/api/health", {}, env)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
    })
  })

  it("answers unknown api routes with a JSON 404", async () => {
    const response = await app.request("/api/x", {}, env)

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      action: "Verifique o endereço e tente novamente.",
      message: "Rota não encontrada.",
      name: "NotFoundError",
      statusCode: 404,
    })
  })

  it("does not emit the old api identity header", async () => {
    const response = await app.request("/api/auth/session", {}, env)

    expect(response.headers.get("x-bodylog-api")).toBeNull()
  })
})
