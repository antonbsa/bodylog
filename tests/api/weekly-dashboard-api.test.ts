import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { app } from "../../apps/api/src/index"
import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
} from "../../apps/api/src/auth/session"
import { getCurrentDateOnly } from "../../apps/api/src/dashboard/weekly-dashboard-service"
import type { WeeklyDashboard } from "../../types/dashboard"

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

describe("weekly dashboard api", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns the current week, previous week, variation, counts, and partial-week metadata", async () => {
    const env = createEnv()
    const sessionCookieValue = await createSessionCookieValue(
      env.SESSION_SECRET,
    )
    const response = await app.request(
      "/api/dashboard/weekly",
      {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${sessionCookieValue}`,
        },
      },
      env,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      current: {
        weekStartDate: "2026-06-08",
        weekEndDate: "2026-06-14",
        measurementCount: 2,
        recordedDates: ["2026-06-08", "2026-06-10"],
        isCurrentWeek: true,
        isPartialWeek: true,
        averages: {
          weightKg: 73,
          bmi: 25.87,
          bodyFatPercentage: 14,
          bodyFatKg: 10.36,
          musclePercentage: 44,
          muscleKg: 32.56,
          restingMetabolismKcal: 1700,
          waistCm: 88.5,
          sleepHours: 7.5,
          disposition: null,
        },
      },
      display: {
        mode: "current-week",
        summary: {
          weekStartDate: "2026-06-08",
          weekEndDate: "2026-06-14",
          measurementCount: 2,
          recordedDates: ["2026-06-08", "2026-06-10"],
          isCurrentWeek: true,
          isPartialWeek: true,
          averages: {
            weightKg: 73,
            bmi: 25.87,
            bodyFatPercentage: 14,
            bodyFatKg: 10.36,
            musclePercentage: 44,
            muscleKg: 32.56,
            restingMetabolismKcal: 1700,
            waistCm: 88.5,
            sleepHours: 7.5,
            disposition: null,
          },
        },
        variation: {
          weightKg: {
            absolute: 1,
            relativePercentage: 1.39,
            direction: "up",
          },
          bmi: {
            absolute: 0.36,
            relativePercentage: 1.41,
            direction: "up",
          },
          bodyFatPercentage: {
            absolutePercentagePoints: -2.2,
            relativePercentage: -13.58,
            direction: "down",
          },
          bodyFatKg: {
            absolute: -1.31,
            relativePercentage: -11.23,
            direction: "down",
          },
          musclePercentage: {
            absolutePercentagePoints: 1.25,
            relativePercentage: 2.92,
            direction: "up",
          },
          muscleKg: {
            absolute: 1.77,
            relativePercentage: 5.75,
            direction: "up",
          },
          restingMetabolismKcal: {
            absolute: 10,
            relativePercentage: 0.59,
            direction: "up",
          },
          waistCm: {
            absolute: -2.5,
            relativePercentage: -2.75,
            direction: "down",
          },
        },
      },
      previous: {
        weekStartDate: "2026-06-01",
        weekEndDate: "2026-06-07",
        measurementCount: 2,
        recordedDates: ["2026-06-01", "2026-06-07"],
        isCurrentWeek: false,
        isPartialWeek: false,
        averages: {
          weightKg: 72,
          bmi: 25.51,
          bodyFatPercentage: 16.2,
          bodyFatKg: 11.67,
          musclePercentage: 42.75,
          muscleKg: 30.79,
          restingMetabolismKcal: 1690,
          waistCm: 91,
          sleepHours: null,
          disposition: null,
        },
      },
      variation: {
        weightKg: {
          absolute: 1,
          relativePercentage: 1.39,
          direction: "up",
        },
        bmi: {
          absolute: 0.36,
          relativePercentage: 1.41,
          direction: "up",
        },
        bodyFatPercentage: {
          absolutePercentagePoints: -2.2,
          relativePercentage: -13.58,
          direction: "down",
        },
        bodyFatKg: {
          absolute: -1.31,
          relativePercentage: -11.23,
          direction: "down",
        },
        musclePercentage: {
          absolutePercentagePoints: 1.25,
          relativePercentage: 2.92,
          direction: "up",
        },
        muscleKg: {
          absolute: 1.77,
          relativePercentage: 5.75,
          direction: "up",
        },
        restingMetabolismKcal: {
          absolute: 10,
          relativePercentage: 0.59,
          direction: "up",
        },
        waistCm: {
          absolute: -2.5,
          relativePercentage: -2.75,
          direction: "down",
        },
      },
    })
  })

  it("uses the configured timezone when deriving the current dashboard date", async () => {
    vi.setSystemTime(new Date("2026-06-15T01:30:00.000Z"))

    expect(getCurrentDateOnly("America/Sao_Paulo")).toBe("2026-06-14")

    const env = createEnv()
    const sessionCookieValue = await createSessionCookieValue(
      env.SESSION_SECRET,
    )
    const response = await app.request(
      "/api/dashboard/weekly",
      {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${sessionCookieValue}`,
        },
      },
      env,
    )
    const body = (await response.json()) as WeeklyDashboard

    expect(response.status).toBe(200)
    expect(body.current.weekStartDate).toBe("2026-06-08")
    expect(body.current.weekEndDate).toBe("2026-06-14")
  })
})

function createEnv(): {
  APP_PASSWORD: string
  DB: D1Database
  SESSION_SECRET: string
  USER_HEIGHT_CM: string
  USER_TIME_ZONE: string
} {
  return {
    APP_PASSWORD: "correct-password",
    DB: new DashboardMeasurementD1([
      measurementRow({
        id: "previous-1",
        date: "2026-06-01",
        weightKg: 71,
        bodyFatPercentage: 16,
        musclePercentage: 42,
        restingMetabolismKcal: 1680,
        waistCm: 90,
      }),
      measurementRow({
        id: "previous-2",
        date: "2026-06-07",
        weightKg: 73,
        bodyFatPercentage: 16.4,
        musclePercentage: 43.5,
        restingMetabolismKcal: 1700,
        waistCm: 92,
      }),
      measurementRow({
        id: "current-1",
        date: "2026-06-08",
        weightKg: 74,
        bodyFatPercentage: 14,
        musclePercentage: 44,
        restingMetabolismKcal: 1710,
        waistCm: 88.5,
        sleepHours: 7,
      }),
      measurementRow({
        id: "current-2",
        date: "2026-06-10",
        weightKg: 72,
        bodyFatPercentage: null,
        musclePercentage: null,
        restingMetabolismKcal: 1690,
        sleepHours: 8,
      }),
    ]) as unknown as D1Database,
    SESSION_SECRET: "test-session-secret",
    USER_HEIGHT_CM: "168",
    USER_TIME_ZONE: "America/Sao_Paulo",
  }
}

function measurementRow(input: {
  id: string
  date: string
  weightKg: number
  bodyFatPercentage?: number | null
  musclePercentage?: number | null
  restingMetabolismKcal?: number | null
  waistCm?: number | null
  sleepHours?: number | null
}): MeasurementRow {
  return {
    id: input.id,
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
