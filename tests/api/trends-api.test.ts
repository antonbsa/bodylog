import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/index"
import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
} from "../../apps/api/src/auth/session"
import type { TrendsResponse } from "../../types/trends"

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

describe("trends api", () => {
  it("requires a session", async () => {
    const response = await app.request("/api/trends", {}, createEnv([]))

    expect(response.status).toBe(401)
  })

  it("returns every measurement oldest first with the derived bmi", async () => {
    const response = await getTrends([
      measurementRow("2026-06-10", { weight_kg: 72 }),
      measurementRow("2026-05-01", {
        body_fat_percentage: 18.5,
        disposition: 4,
        resting_metabolism_kcal: 1650,
        sleep_hours: 7.5,
        waist_cm: 84,
        weight_kg: 74,
      }),
    ])
    const body = (await response.json()) as TrendsResponse

    expect(response.status).toBe(200)
    expect(body.points.map((point) => point.date)).toEqual([
      "2026-05-01",
      "2026-06-10",
    ])
    expect(body.points[0]).toMatchObject({
      bodyFatPercentage: 18.5,
      disposition: 4,
      musclePercentage: null,
      restingMetabolismKcal: 1650,
      sleepHours: 7.5,
      waistCm: 84,
      weightKg: 74,
    })
    expect(body.points[0]?.bmi).toBeCloseTo(26.22, 2)
    expect(body.points[1]?.bmi).toBeCloseTo(25.51, 2)
  })

  it("is not capped like the measurements list", async () => {
    const rows = Array.from({ length: 150 }, (_, index) =>
      measurementRow(
        new Date(Date.UTC(2026, 0, 1 + index)).toISOString().slice(0, 10),
        {},
      ),
    )
    const body = (await (await getTrends(rows)).json()) as TrendsResponse

    expect(body.points).toHaveLength(150)
  })

  it("returns no points without records", async () => {
    expect(await (await getTrends([])).json()).toEqual({ points: [] })
  })
})

async function getTrends(rows: MeasurementRow[]) {
  const env = createEnv(rows)
  const sessionCookieValue = await createSessionCookieValue(env.SESSION_SECRET)

  return app.request(
    "/api/trends",
    { headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionCookieValue}` } },
    env,
  )
}

function createEnv(rows: MeasurementRow[]) {
  return {
    APP_PASSWORD: "correct-password",
    DB: new FakeD1(rows) as unknown as D1Database,
    SESSION_SECRET: "test-session-secret",
    USER_HEIGHT_CM: "168",
    USER_TIME_ZONE: "America/Sao_Paulo",
  }
}

function measurementRow(
  date: string,
  overrides: Partial<MeasurementRow>,
): MeasurementRow {
  return {
    id: `measurement-${date}`,
    date,
    weight_kg: 72,
    body_fat_percentage: null,
    muscle_percentage: null,
    resting_metabolism_kcal: null,
    waist_cm: null,
    sleep_hours: null,
    disposition: null,
    notes: null,
    created_at: "2026-06-10T12:00:00.000Z",
    updated_at: "2026-06-10T12:00:00.000Z",
    ...overrides,
  }
}

class FakeD1 {
  private readonly rows: MeasurementRow[]

  constructor(rows: MeasurementRow[]) {
    this.rows = rows
  }

  prepare(query: string) {
    const rows = this.rows
    const sql = query.replace(/\s+/g, " ").trim()
    const statement = {
      bind: () => statement,
      async all<T>() {
        if (
          !sql.includes("FROM measurements") ||
          !sql.includes("ORDER BY date DESC")
        ) {
          throw new Error(`Unsupported all query: ${sql}`)
        }

        const results = [...rows].sort((left, right) =>
          right.date.localeCompare(left.date),
        )

        return { results: results as T[], success: true, meta: {} }
      },
    }

    return statement
  }
}
