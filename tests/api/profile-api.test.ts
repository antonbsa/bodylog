import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { app } from "../../apps/api/src/app"
import type { SessionResponse } from "../../types/auth"
import type { WeeklyDashboard } from "../../types/dashboard"
import type { HistoryMeasurement, HistoryWeeksPage } from "../../types/history"
import type { MeasurementLookup } from "../../types/measurements"
import type { TrendsResponse } from "../../types/trends"
import { createTestEnv } from "./test-env"

const invalidProfileBody = {
  action: "Revise a altura e tente novamente.",
  message: "Dados do perfil inválidos.",
  name: "ValidationError",
  statusCode: 400,
}

function setup() {
  const testEnv = createTestEnv()
  const ana = testEnv.signIn("ana")
  const bia = testEnv.signIn("bia")

  const request = (cookie: string, path: string, init: RequestInit = {}) =>
    app.request(
      path,
      { ...init, headers: { ...init.headers, cookie } },
      testEnv.env,
    )
  const patchMe = (cookie: string, body: unknown) =>
    request(cookie, "/api/me", {
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })
  const session = async (cookie: string) =>
    (
      (await (
        await request(cookie, "/api/auth/session")
      ).json()) as SessionResponse
    ).user

  return { ...testEnv, ana, bia, patchMe, request, session }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("profile", () => {
  it("starts with no height and no stored time zone", async () => {
    const { ana, session } = setup()

    expect(await session(ana)).toEqual({
      displayName: "ana",
      email: null,
      heightCm: null,
      id: "ana",
      timeZone: null,
    })
  })

  it("updates the height and time zone and returns the user", async () => {
    const { ana, patchMe, session } = setup()
    const response = await patchMe(ana, {
      heightCm: 172,
      timeZone: "Asia/Tokyo",
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      user: {
        displayName: "ana",
        email: null,
        heightCm: 172,
        id: "ana",
        timeZone: "Asia/Tokyo",
      },
    })
    expect(await session(ana)).toMatchObject({
      heightCm: 172,
      timeZone: "Asia/Tokyo",
    })
  })

  it("updates one field without touching the other", async () => {
    const { ana, patchMe, session } = setup()

    await patchMe(ana, { heightCm: 168, timeZone: "Asia/Tokyo" })
    await patchMe(ana, { timeZone: "Europe/Lisbon" })

    expect(await session(ana)).toMatchObject({
      heightCm: 168,
      timeZone: "Europe/Lisbon",
    })
  })

  it("clears the height with null", async () => {
    const { ana, patchMe, session } = setup()

    await patchMe(ana, { heightCm: 168 })
    await patchMe(ana, { heightCm: null })

    expect(await session(ana)).toMatchObject({ heightCm: null })
  })

  it.each([
    ["a height below the limit", { heightCm: 49.9 }],
    ["a height above the limit", { heightCm: 250.1 }],
    ["a height that isn't a number", { heightCm: "168" }],
    ["a height with a fraction", { heightCm: 172.5 }],
    ["an unknown time zone", { timeZone: "Mars/Olympus" }],
    ["a UTC offset instead of a zone", { timeZone: "+03:00" }],
    ["a time zone that isn't a string", { timeZone: 3 }],
    ["a null time zone", { timeZone: null }],
    ["a body with neither field", {}],
    ["a body that isn't an object", "168"],
  ])("rejects %s with 400 and keeps the stored profile", async (_, body) => {
    const { ana, patchMe, session } = setup()

    await patchMe(ana, { heightCm: 168, timeZone: "America/Sao_Paulo" })

    const response = await patchMe(ana, body)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual(invalidProfileBody)
    expect(await session(ana)).toMatchObject({
      heightCm: 168,
      timeZone: "America/Sao_Paulo",
    })
  })

  it("rejects a valid height when the zone in the same body is invalid", async () => {
    const { ana, patchMe, session } = setup()
    const response = await patchMe(ana, {
      heightCm: 180,
      timeZone: "Mars/Olympus",
    })

    expect(response.status).toBe(400)
    expect(await session(ana)).toMatchObject({ heightCm: null, timeZone: null })
  })

  it("stores the zone as the device spelled it, so the next start compares equal", async () => {
    const { ana, patchMe, session } = setup()

    await patchMe(ana, { timeZone: "Asia/Calcutta" })

    expect(await session(ana)).toMatchObject({ timeZone: "Asia/Calcutta" })
  })

  it("requires a session", async () => {
    const { env } = createTestEnv()
    const response = await app.request(
      "/api/me",
      { body: JSON.stringify({ heightCm: 168 }), method: "PATCH" },
      env,
    )

    expect(response.status).toBe(401)
  })

  it("never changes another user's profile", async () => {
    const { ana, bia, patchMe, session } = setup()

    await patchMe(ana, { heightCm: 168, timeZone: "Asia/Tokyo" })

    expect(await session(bia)).toMatchObject({ heightCm: null, timeZone: null })
  })
})

describe("BMI from the user's height", () => {
  function setupWithMeasurement() {
    const context = setup()

    for (const user of ["ana", "bia"]) {
      context.insertMeasurement(user, {
        body_fat_percentage: 20,
        date: "2026-06-09",
        weight_kg: 72.9,
      })
    }

    return context
  }

  it("is null everywhere while the height is unset", async () => {
    const { ana, request } = setupWithMeasurement()

    const list = (await (await request(ana, "/api/measurements")).json()) as {
      items: HistoryMeasurement[]
    }
    const lookup = (await (
      await request(ana, "/api/measurements/by-date/2026-06-09")
    ).json()) as MeasurementLookup
    const dashboard = (await (
      await request(ana, "/api/dashboard/weekly")
    ).json()) as WeeklyDashboard
    const history = (await (
      await request(ana, "/api/history/weeks")
    ).json()) as HistoryWeeksPage
    const trends = (await (
      await request(ana, "/api/trends")
    ).json()) as TrendsResponse

    expect(list.items[0]?.derived).toEqual({
      bmi: null,
      bodyFatKg: 14.58,
      muscleKg: null,
    })
    expect(lookup.heightCm).toBeNull()
    expect(dashboard.current.averages.bmi).toBeNull()
    expect(dashboard.current.averages.bodyFatKg).toBe(14.58)
    expect(history.weeks[0]?.measurements[0]?.derived.bmi).toBeNull()
    expect(history.weeks[0]?.summary.averages.bmi).toBeNull()
    expect(trends.points[0]?.bmi).toBeNull()
  })

  it("follows the caller's height on every screen and never another user's", async () => {
    const { ana, bia, patchMe, request } = setupWithMeasurement()

    await patchMe(ana, { heightCm: 168 })
    await patchMe(bia, { heightCm: 180 })

    const bmiOf = async (cookie: string) => {
      const list = (await (
        await request(cookie, "/api/measurements")
      ).json()) as {
        items: HistoryMeasurement[]
      }
      const lookup = (await (
        await request(cookie, "/api/measurements/by-date/2026-06-09")
      ).json()) as MeasurementLookup
      const dashboard = (await (
        await request(cookie, "/api/dashboard/weekly")
      ).json()) as WeeklyDashboard
      const history = (await (
        await request(cookie, "/api/history/weeks")
      ).json()) as HistoryWeeksPage
      const trends = (await (
        await request(cookie, "/api/trends")
      ).json()) as TrendsResponse

      return {
        dashboard: dashboard.current.averages.bmi,
        history: history.weeks[0]?.measurements[0]?.derived.bmi,
        list: list.items[0]?.derived.bmi,
        lookupHeight: lookup.heightCm,
        trends: trends.points[0]?.bmi,
      }
    }

    expect(await bmiOf(ana)).toEqual({
      dashboard: 25.83,
      history: 25.83,
      list: 25.83,
      lookupHeight: 168,
      trends: 25.83,
    })
    expect(await bmiOf(bia)).toEqual({
      dashboard: 22.5,
      history: 22.5,
      list: 22.5,
      lookupHeight: 180,
      trends: 22.5,
    })
  })
})

describe("today from the user's time zone", () => {
  // Sunday 2026-06-14 22:00 in São Paulo is already Monday 2026-06-15 10:00 in Tokyo.
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-06-15T01:00:00.000Z"))
  })

  it("falls back to America/Sao_Paulo while no zone is stored", async () => {
    const { ana, request } = setup()
    const dashboard = (await (
      await request(ana, "/api/dashboard/weekly")
    ).json()) as WeeklyDashboard

    expect(dashboard.current.weekStartDate).toBe("2026-06-08")
  })

  it("puts the current week where each user's zone says it is", async () => {
    const { ana, bia, insertMeasurement, patchMe, request } = setup()

    await patchMe(ana, { timeZone: "America/Sao_Paulo" })
    await patchMe(bia, { timeZone: "Asia/Tokyo" })

    for (const user of ["ana", "bia"]) {
      insertMeasurement(user, { date: "2026-06-14", weight_kg: 70 })
    }

    const weekOf = async (cookie: string) => {
      const dashboard = (await (
        await request(cookie, "/api/dashboard/weekly")
      ).json()) as WeeklyDashboard
      const history = (await (
        await request(cookie, "/api/history/weeks")
      ).json()) as HistoryWeeksPage

      return {
        currentWeekStart: dashboard.current.weekStartDate,
        historyWeekIsCurrent: history.weeks[0]?.summary.isCurrentWeek,
      }
    }

    expect(await weekOf(ana)).toEqual({
      currentWeekStart: "2026-06-08",
      historyWeekIsCurrent: true,
    })
    expect(await weekOf(bia)).toEqual({
      currentWeekStart: "2026-06-15",
      historyWeekIsCurrent: false,
    })
  })
})
