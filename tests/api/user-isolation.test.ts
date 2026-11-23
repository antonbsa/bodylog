import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { app } from "../../apps/api/src/app"
import type {
  ApiTokenListResponse,
  CreateApiTokenResponse,
} from "../../types/api-tokens"
import type { WeeklyDashboard } from "../../types/dashboard"
import type { HistoryWeeksPage } from "../../types/history"
import type { TrendsResponse } from "../../types/trends"
import { createTestEnv } from "./test-env"

/** Ana and Bia each have a record on 2026-06-08; only Bia has one on 2026-06-09. */
function setup() {
  const testEnv = createTestEnv()
  const ana = testEnv.signIn("ana")
  const bia = testEnv.signIn("bia")

  testEnv.insertMeasurement("ana", {
    date: "2026-06-08",
    id: "ana-08",
    weight_kg: 60,
  })
  testEnv.insertMeasurement("bia", {
    date: "2026-06-08",
    id: "bia-08",
    weight_kg: 90,
  })
  testEnv.insertMeasurement("bia", {
    date: "2026-06-09",
    id: "bia-09",
    weight_kg: 91,
  })

  const request = (cookie: string, path: string, init: RequestInit = {}) =>
    app.request(
      path,
      { ...init, headers: { ...init.headers, cookie } },
      testEnv.env,
    )

  return { ...testEnv, ana, bia, request }
}

function csvUpload(content: string) {
  const form = new FormData()

  form.append("file", new File([content], "m.csv", { type: "text/csv" }))

  return { body: form, method: "POST" }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("per-user data", () => {
  it("lists only the caller's measurements", async () => {
    const { ana, request } = setup()
    const body = (await (await request(ana, "/api/measurements")).json()) as {
      items: Array<{ id: string }>
    }

    expect(body.items.map((item) => item.id)).toEqual(["ana-08"])
  })

  it("loads the caller's record for a date another user also recorded", async () => {
    const { ana, bia, request } = setup()
    const anaItem = await (
      await request(ana, "/api/measurements/by-date/2026-06-08")
    ).json()

    expect(anaItem).toMatchObject({ item: { id: "ana-08", weightKg: 60 } })
    expect(
      (await request(ana, "/api/measurements/by-date/2026-06-09")).status,
    ).toBe(404)
    expect(
      await (await request(bia, "/api/measurements/by-date/2026-06-09")).json(),
    ).toMatchObject({ item: { id: "bia-09" } })
  })

  it("lets both users record the same date, each editing only their own", async () => {
    const { ana, bia, measurementRows, request } = setup()
    const put = (cookie: string, weightKg: number) =>
      request(cookie, "/api/measurements/by-date/2026-06-10", {
        body: JSON.stringify({ weightKg }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      })

    expect((await put(ana, 61)).status).toBe(200)
    expect((await put(bia, 92)).status).toBe(200)
    expect((await put(ana, 62)).status).toBe(200)

    expect(
      measurementRows("ana").map((row) => [row.date, row.weight_kg]),
    ).toEqual([
      ["2026-06-08", 60],
      ["2026-06-10", 62],
    ])
    expect(
      measurementRows("bia").map((row) => [row.date, row.weight_kg]),
    ).toEqual([
      ["2026-06-08", 90],
      ["2026-06-09", 91],
      ["2026-06-10", 92],
    ])
  })

  it("never deletes another user's measurement", async () => {
    const { ana, bia, measurementRows, request } = setup()
    const response = await request(bia, "/api/measurements/ana-08", {
      method: "DELETE",
    })

    expect(response.status).toBe(404)
    expect(measurementRows("ana")).toHaveLength(1)
    expect(
      (await request(ana, "/api/measurements/ana-08", { method: "DELETE" }))
        .status,
    ).toBe(200)
  })

  it("builds the dashboard, history and trends from the caller's records", async () => {
    const { ana, request } = setup()
    const dashboard = (await (
      await request(ana, "/api/dashboard/weekly")
    ).json()) as WeeklyDashboard
    const history = (await (
      await request(ana, "/api/history/weeks")
    ).json()) as HistoryWeeksPage
    const trends = (await (
      await request(ana, "/api/trends")
    ).json()) as TrendsResponse

    expect(dashboard.current.recordedDates).toEqual(["2026-06-08"])
    expect(dashboard.current.averages.weightKg).toBe(60)
    expect(
      history.weeks.flatMap((week) => week.measurements.map((m) => m.id)),
    ).toEqual(["ana-08"])
    expect(trends.points.map((point) => point.weightKg)).toEqual([60])
  })

  it("exports only the caller's measurements", async () => {
    const { bia, request } = setup()
    const csv = await (await request(bia, "/api/export/csv")).text()

    expect(csv).toContain("2026-06-09")
    expect(csv).not.toContain("60")
    expect(csv.trim().split("\n")).toHaveLength(3)
  })

  it("previews and imports into the caller's account only", async () => {
    const { ana, measurementRows, request } = setup()
    const file = "date,weight_kg\n2026-06-08,61\n2026-06-09,62\n"
    const preview = await (
      await request(ana, "/api/import/csv/preview", csvUpload(file))
    ).json()

    // Bia's 2026-06-09 doesn't count as an update for Ana.
    expect(preview).toMatchObject({ counts: { created: 1, updated: 1 } })

    expect(
      (await request(ana, "/api/import/csv", csvUpload(file))).status,
    ).toBe(200)
    expect(
      measurementRows("ana").map((row) => [row.date, row.weight_kg]),
    ).toEqual([
      ["2026-06-08", 61],
      ["2026-06-09", 62],
    ])
    expect(
      measurementRows("bia").map((row) => [row.date, row.weight_kg]),
    ).toEqual([
      ["2026-06-08", 90],
      ["2026-06-09", 91],
    ])
  })

  it("lists and revokes only the caller's API tokens", async () => {
    const { ana, bia, request, sqlite } = setup()
    const create = async (cookie: string, name: string) =>
      (await (
        await request(cookie, "/api/tokens", {
          body: JSON.stringify({ name }),
          headers: { "content-type": "application/json" },
          method: "POST",
        })
      ).json()) as CreateApiTokenResponse
    const listNames = async (cookie: string) =>
      (
        (await (
          await request(cookie, "/api/tokens")
        ).json()) as ApiTokenListResponse
      ).items.map((item) => item.name)
    const anaToken = await create(ana, "Agente")

    await create(bia, "Planilha")

    expect(await listNames(ana)).toEqual(["Agente"])
    expect(await listNames(bia)).toEqual(["Planilha"])
    expect(
      (
        await request(bia, `/api/tokens/${anaToken.item.id}`, {
          method: "DELETE",
        })
      ).status,
    ).toBe(404)
    expect(sqlite.prepare("SELECT id FROM api_tokens").all()).toHaveLength(2)
  })

  it("serves each token's owner only their own measurements through /mcp", async () => {
    const { ana, bia, env, request } = setup()
    const createToken = async (cookie: string) =>
      (await (
        await request(cookie, "/api/tokens", {
          body: JSON.stringify({ name: "Agente" }),
          headers: { "content-type": "application/json" },
          method: "POST",
        })
      ).json()) as CreateApiTokenResponse
    const listWeights = async (token: string) => {
      const response = await app.request(
        "/mcp",
        {
          body: JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            method: "tools/call",
            params: { arguments: {}, name: "list_measurements" },
          }),
          headers: {
            accept: "application/json, text/event-stream",
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          method: "POST",
        },
        env,
      )
      const frame = (await response.text())
        .split("\n")
        .find((line) => line.startsWith("data:"))!
      const body = JSON.parse(frame.slice(5)) as {
        result: {
          structuredContent: { items: { date: string; weightKg: number }[] }
        }
      }

      return body.result.structuredContent.items.map((item) => [
        item.date,
        item.weightKg,
      ])
    }
    const anaToken = await createToken(ana)
    const biaToken = await createToken(bia)

    expect(await listWeights(anaToken.token)).toEqual([["2026-06-08", 60]])
    expect(await listWeights(biaToken.token)).toEqual([
      ["2026-06-08", 90],
      ["2026-06-09", 91],
    ])
  })
})
