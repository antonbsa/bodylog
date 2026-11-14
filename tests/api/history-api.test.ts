import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { app } from "../../apps/api/src/index"
import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
} from "../../apps/api/src/auth/session"
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
  const env = createEnv(rows)
  const sessionCookieValue = await createSessionCookieValue(env.SESSION_SECRET)

  return app.request(
    `/api/history/weeks${query}`,
    { headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionCookieValue}` } },
    env,
  )
}

function createEnv(rows: MeasurementRow[]) {
  return {
    APP_PASSWORD: "correct-password",
    DB: new DashboardMeasurementD1(rows) as unknown as D1Database,
    SESSION_SECRET: "test-session-secret",
    USER_HEIGHT_CM: "168",
    USER_TIME_ZONE: "America/Sao_Paulo",
  }
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

class DashboardMeasurementD1 {
  private readonly rows: MeasurementRow[]

  constructor(rows: MeasurementRow[]) {
    this.rows = rows
  }

  prepare(query: string): DashboardMeasurementD1Statement {
    return new DashboardMeasurementD1Statement(this.rows, normalizeSql(query))
  }
}

class DashboardMeasurementD1Statement {
  private readonly rows: MeasurementRow[]
  private readonly query: string

  constructor(rows: MeasurementRow[], query: string) {
    this.rows = rows
    this.query = query
  }

  bind(): DashboardMeasurementD1Statement {
    return this
  }

  async all<T>(): Promise<D1Result<T>> {
    if (
      !this.query.includes("FROM measurements") ||
      !this.query.includes("ORDER BY date DESC")
    ) {
      throw new Error(`Unsupported all query: ${this.query}`)
    }

    const results = [...this.rows].sort((left, right) =>
      right.date.localeCompare(left.date),
    )

    return {
      results: results as T[],
      success: true,
      meta: {
        changed_db: false,
        changes: 0,
        duration: 0,
        last_row_id: 0,
        rows_read: results.length,
        rows_written: 0,
        size_after: 0,
      },
    } as D1Result<T>
  }
}

function normalizeSql(query: string): string {
  return query.replace(/\s+/g, " ").trim()
}
