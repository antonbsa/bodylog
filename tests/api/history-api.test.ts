import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { app } from "../../apps/api/src/app"
import { createSignedInEnv, SIGNED_IN_COOKIE } from "./test-env"
import type { HistoryWeeksPage } from "../../types/history"

type MeasurementRow = {
  id: string
  date: string
  weight_kg: number
  body_fat_percentage: number | null
  muscle_percentage: number | null
  resting_metabolism_kcal: number | null
  waist_cm: number | null
  sleep_hours: number | null
  disposition: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

describe("history api", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("requires a session", async () => {
    const response = await app.request("/api/history/weeks", {}, createEnv([]))

    expect(response.status).toBe(401)
  })

  it("returns weekly cards with summaries and records, newest first", async () => {
    const response = await getWeeks("", [
      measurementRow({ date: "2026-06-01", weightKg: 71 }),
      measurementRow({ date: "2026-06-07", weightKg: 73 }),
      measurementRow({ date: "2026-06-08", weightKg: 74 }),
      measurementRow({ date: "2026-06-10", weightKg: 72 }),
    ])
    const body = (await response.json()) as HistoryWeeksPage

    expect(response.status).toBe(200)
    expect(body.nextBefore).toBeNull()
    expect(body.weeks.map((week) => week.summary.weekStartDate)).toEqual([
      "2026-06-08",
      "2026-06-01",
    ])
    expect(body.weeks[0]?.summary.measurementCount).toBe(2)
    expect(body.weeks[0]?.summary.averages.weightKg).toBe(73)
    expect(body.weeks[0]?.summary.isCurrentWeek).toBe(true)
    expect(body.weeks[0]?.measurements.map((item) => item.date)).toEqual([
      "2026-06-10",
      "2026-06-08",
    ])
    expect(body.weeks[0]?.measurements[0]?.derived.bmi).toBeCloseTo(25.51, 2)
  })

  it("pages with before and nextBefore", async () => {
    const rows = Array.from({ length: 9 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 5, 8 - 7 * index))

      return measurementRow({
        date: date.toISOString().slice(0, 10),
        weightKg: 70,
      })
    })
    const first = (await (await getWeeks("", rows)).json()) as HistoryWeeksPage

    expect(first.weeks).toHaveLength(8)
    expect(first.nextBefore).toBe("2026-04-20")

    const second = (await (
      await getWeeks(`?before=${first.nextBefore}`, rows)
    ).json()) as HistoryWeeksPage

    expect(second.weeks.map((week) => week.summary.weekStartDate)).toEqual([
      "2026-04-13",
    ])
    expect(second.nextBefore).toBeNull()
  })

  it("returns an empty page without records", async () => {
    const response = await getWeeks("", [])

    expect(await response.json()).toEqual({ nextBefore: null, weeks: [] })
  })

  it("rejects an invalid before date", async () => {
    const response = await getWeeks("?before=yesterday", [])

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ message: "Data inválida." })
  })
})

async function getWeeks(query: string, rows: MeasurementRow[]) {
  return app.request(
    `/api/history/weeks${query}`,
    { headers: { cookie: SIGNED_IN_COOKIE } },
    createEnv(rows),
  )
}

function createEnv(rows: MeasurementRow[]) {
  return createSignedInEnv(rows).env
}

function measurementRow(input: {
  id?: string
  date: string
  weightKg: number
  bodyFatPercentage?: number | null
  musclePercentage?: number | null
  restingMetabolismKcal?: number | null
  waistCm?: number | null
  sleepHours?: number | null
}): MeasurementRow {
  return {
    id: input.id ?? `measurement-${input.date}`,
    date: input.date,
    weight_kg: input.weightKg,
    body_fat_percentage: input.bodyFatPercentage ?? null,
    muscle_percentage: input.musclePercentage ?? null,
    resting_metabolism_kcal: input.restingMetabolismKcal ?? null,
    waist_cm: input.waistCm ?? null,
    sleep_hours: input.sleepHours ?? null,
    disposition: null,
    notes: null,
    created_at: "2026-06-10T12:00:00.000Z",
    updated_at: "2026-06-10T12:00:00.000Z",
  }
}
