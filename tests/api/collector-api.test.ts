import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/app"
import type {
  ApiTokenListResponse,
  CreateApiTokenResponse,
} from "../../types/api-tokens"
import type { CollectorMeasurementsResponse } from "../../types/measurements"
import { createTestEnv } from "./test-env"

/** Ana (180 cm) and Bia each sign in, own measurements and create one token through `POST /api/tokens`. */
async function setup() {
  const testEnv = createTestEnv()

  testEnv.createUser("ana", "Ana", { heightCm: 180 })
  testEnv.createUser("bia", "Bia")
  const anaCookie = testEnv.createSession("ana")
  const biaCookie = testEnv.createSession("bia")

  for (const [date, weight, bodyFat] of [
    ["2026-06-12", 72.4, 14.2],
    ["2026-06-10", 72.9, null],
    ["2026-06-11", 72.6, null],
  ] as const) {
    testEnv.insertMeasurement("ana", {
      body_fat_percentage: bodyFat,
      created_at: "2026-06-01T00:00:00.000Z",
      date,
      updated_at: "2026-06-02T00:00:00.000Z",
      weight_kg: weight,
    })
  }

  testEnv.insertMeasurement("bia", { date: "2026-06-11", weight_kg: 60 })

  const createToken = async (cookie: string) => {
    const response = await app.request(
      "/api/tokens",
      {
        body: JSON.stringify({ name: "Agente" }),
        headers: { cookie, "content-type": "application/json" },
        method: "POST",
      },
      testEnv.env,
    )

    return (await response.json()) as CreateApiTokenResponse
  }

  const anaToken = await createToken(anaCookie)
  const biaToken = await createToken(biaCookie)

  const collect = (headers: Record<string, string>, query = "") =>
    app.request(`/api/collector/measurements${query}`, { headers }, testEnv.env)

  return { ...testEnv, anaCookie, anaToken, biaToken, collect }
}

const bearer = (token: string) => ({ authorization: `Bearer ${token}` })

async function readBody(response: Response) {
  return (await response.json()) as CollectorMeasurementsResponse
}

describe("GET /api/collector/measurements", () => {
  it("returns the token owner's measurements in date order with derived values", async () => {
    const { anaToken, collect } = await setup()
    const response = await collect(bearer(anaToken.token))

    expect(response.status).toBe(200)

    const body = await readBody(response)

    expect(body).toMatchObject({
      count: 3,
      filters: { from: null, to: null },
      heightCm: 180,
    })
    expect(body.items.map((item) => item.date)).toEqual([
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
    ])
    expect(body.items[2]).toEqual({
      bodyFatPercentage: 14.2,
      createdAt: "2026-06-01T00:00:00.000Z",
      date: "2026-06-12",
      derived: { bmi: 22.35, bodyFatKg: 10.28, muscleKg: null },
      disposition: null,
      musclePercentage: null,
      notes: null,
      restingMetabolismKcal: null,
      sleepHours: null,
      updatedAt: "2026-06-02T00:00:00.000Z",
      waistCm: null,
      weightKg: 72.4,
    })
  })

  it("returns only the token owner's data, with a null height and BMI when unset", async () => {
    const { biaToken, collect } = await setup()
    const body = await readBody(await collect(bearer(biaToken.token)))

    expect(body.count).toBe(1)
    expect(body.heightCm).toBeNull()
    expect(body.items[0]).toMatchObject({
      date: "2026-06-11",
      derived: { bmi: null },
      weightKg: 60,
    })
  })

  it("filters by an inclusive date range", async () => {
    const { anaToken, collect } = await setup()
    const body = await readBody(
      await collect(bearer(anaToken.token), "?from=2026-06-11&to=2026-06-12"),
    )

    expect(body.filters).toEqual({ from: "2026-06-11", to: "2026-06-12" })
    expect(body.count).toBe(2)
    expect(body.items.map((item) => item.date)).toEqual([
      "2026-06-11",
      "2026-06-12",
    ])
  })

  it("filters by one side of the range, echoing the other as null", async () => {
    const { anaToken, collect } = await setup()

    for (const [query, filters, dates] of [
      [
        "from=2026-06-11",
        { from: "2026-06-11", to: null },
        ["2026-06-11", "2026-06-12"],
      ],
      [
        "to=2026-06-11",
        { from: null, to: "2026-06-11" },
        ["2026-06-10", "2026-06-11"],
      ],
    ] as const) {
      const body = await readBody(
        await collect(bearer(anaToken.token), `?${query}`),
      )

      expect(body.filters, query).toEqual(filters)
      expect(
        body.items.map((item) => item.date),
        query,
      ).toEqual(dates)
    }
  })

  it("returns an empty list when from is after to", async () => {
    const { anaToken, collect } = await setup()
    const response = await collect(
      bearer(anaToken.token),
      "?from=2026-06-12&to=2026-06-10",
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ count: 0, items: [] })
  })

  it("rejects a malformed or impossible date with 400", async () => {
    const { anaToken, collect } = await setup()

    for (const query of ["?from=11/06/2026", "?from=", "?to=2026-02-31"]) {
      const response = await collect(bearer(anaToken.token), query)

      expect(response.status, query).toBe(400)
      expect(await response.json(), query).toMatchObject({
        message: "Data inválida.",
      })
    }
  })

  it("returns 404, not 401, for an unknown collector path", async () => {
    const { env } = await setup()
    const response = await app.request("/api/collector/measurement", {}, env)

    expect(response.status).toBe(404)
  })

  it("accepts the bearer scheme in any case", async () => {
    const { anaToken, collect } = await setup()
    const response = await collect({
      authorization: `bEaReR ${anaToken.token}`,
    })

    expect(response.status).toBe(200)
  })

  it("rejects a wrong, missing or non-bearer token with the standard 401 body", async () => {
    const { anaToken, collect } = await setup()

    for (const headers of [
      bearer("bl_wrong"),
      {},
      { authorization: "Bearer" },
      { authorization: `Basic ${anaToken.token}` },
    ]) {
      const response = await collect(headers)

      expect(response.status).toBe(401)
      expect(await response.json()).toMatchObject({
        message: "Token de API inválido ou ausente.",
        name: "UnauthorizedError",
      })
    }
  })

  it("rejects a revoked token", async () => {
    const { anaCookie, anaToken, collect, env } = await setup()

    await app.request(
      `/api/tokens/${anaToken.item.id}`,
      { headers: { cookie: anaCookie }, method: "DELETE" },
      env,
    )

    expect((await collect(bearer(anaToken.token))).status).toBe(401)
  })

  it("does not accept the session cookie alone", async () => {
    const { anaCookie, collect } = await setup()

    expect((await collect({ cookie: anaCookie })).status).toBe(401)
  })

  it("records the last use, which the token list then shows", async () => {
    const { anaCookie, anaToken, collect, env } = await setup()
    const before = Date.now()

    await collect(bearer(anaToken.token))

    const list = (await (
      await app.request("/api/tokens", { headers: { cookie: anaCookie } }, env)
    ).json()) as ApiTokenListResponse
    const lastUsedAt = list.items[0].lastUsedAt

    expect(lastUsedAt).not.toBeNull()
    expect(Date.parse(lastUsedAt!)).toBeGreaterThanOrEqual(before)
  })

  it("does not authorize any other route", async () => {
    const { anaToken, env } = await setup()
    const attempts = [
      ["GET", "/api/export/csv"],
      ["GET", "/api/measurements"],
      ["GET", "/api/dashboard/weekly"],
      ["GET", "/api/history/weeks"],
      ["GET", "/api/trends"],
      ["POST", "/api/import/csv"],
      ["PUT", "/api/measurements/by-date/2026-06-11"],
      ["DELETE", "/api/measurements/ana-2026-06-11"],
      ["GET", "/api/me"],
      ["GET", "/api/tokens"],
      ["POST", "/api/tokens"],
      ["DELETE", `/api/tokens/${anaToken.item.id}`],
    ]

    for (const [method, path] of attempts) {
      const response = await app.request(
        path,
        { headers: bearer(anaToken.token), method },
        env,
      )

      expect(response.status, `${method} ${path}`).toBe(401)
    }
  })
})
