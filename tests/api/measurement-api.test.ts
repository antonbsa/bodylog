import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/app"
import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
} from "../../apps/api/src/features/auth/session"

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

const baseEnv = {
  APP_PASSWORD: "correct-password",
  SESSION_SECRET: "test-session-secret",
  USER_HEIGHT_CM: "168",
  USER_TIME_ZONE: "America/Sao_Paulo",
}

describe("measurement api", () => {
  it("returns null for a missing measurement date", async () => {
    const env = createEnv()
    const response = await app.request(
      "/api/measurements/by-date/2026-06-10",
      {
        headers: {
          cookie: await createSessionCookieHeader(),
        },
      },
      env,
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      action: "Atualize o histórico e tente novamente.",
      message: "Medida não encontrada.",
      name: "NotFoundError",
      statusCode: 404,
    })
  })

  it("creates a measurement for a date", async () => {
    const env = createEnv()
    const response = await app.request(
      "/api/measurements/by-date/2026-06-10",
      {
        body: JSON.stringify({
          bodyFatPercentage: 14.46,
          musclePercentage: 43.72,
          restingMetabolismKcal: 1700,
          weightKg: 72.9,
        }),
        headers: {
          "content-type": "application/json",
          cookie: await createSessionCookieHeader(),
        },
        method: "PUT",
      },
      env,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      item: expect.objectContaining({
        id: expect.any(String),
        date: "2026-06-10",
        weightKg: 72.9,
        bodyFatPercentage: 14.46,
        musclePercentage: 43.72,
        restingMetabolismKcal: 1700,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    })
  })

  it("loads and updates an existing measurement for a date", async () => {
    const env = createEnv([
      createMeasurementRow({
        date: "2026-06-10",
        id: "existing-measurement",
        weightKg: 72.9,
      }),
    ])

    const loadResponse = await app.request(
      "/api/measurements/by-date/2026-06-10",
      {
        headers: {
          cookie: await createSessionCookieHeader(),
        },
      },
      env,
    )

    expect(loadResponse.status).toBe(200)
    expect(await loadResponse.json()).toEqual({
      item: {
        id: "existing-measurement",
        date: "2026-06-10",
        weightKg: 72.9,
        bodyFatPercentage: null,
        musclePercentage: null,
        restingMetabolismKcal: null,
        waistCm: null,
        sleepHours: null,
        disposition: null,
        notes: null,
        createdAt: "2026-06-09T12:00:00.000Z",
        updatedAt: "2026-06-09T12:00:00.000Z",
      },
      heightCm: 168,
    })

    const updateResponse = await app.request(
      "/api/measurements/by-date/2026-06-10",
      {
        body: JSON.stringify({
          bodyFatPercentage: null,
          musclePercentage: 43.72,
          restingMetabolismKcal: null,
          weightKg: 73.1,
        }),
        headers: {
          "content-type": "application/json",
          cookie: await createSessionCookieHeader(),
        },
        method: "PUT",
      },
      env,
    )

    expect(updateResponse.status).toBe(200)
    expect(await updateResponse.json()).toEqual({
      item: expect.objectContaining({
        id: "existing-measurement",
        date: "2026-06-10",
        weightKg: 73.1,
        bodyFatPercentage: null,
        musclePercentage: 43.72,
        restingMetabolismKcal: null,
        createdAt: "2026-06-09T12:00:00.000Z",
        updatedAt: expect.any(String),
      }),
    })
  })

  it("rejects invalid measurement input", async () => {
    const env = createEnv()
    const response = await app.request(
      "/api/measurements/by-date/2026-06-10",
      {
        body: JSON.stringify({
          bodyFatPercentage: "14,46",
          weightKg: null,
        }),
        headers: {
          "content-type": "application/json",
          cookie: await createSessionCookieHeader(),
        },
        method: "PUT",
      },
      env,
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      action: "Revise os campos da medida e tente novamente.",
      message: "Dados da medida inválidos.",
      name: "ValidationError",
      statusCode: 400,
    })
  })

  it("lists measurements by date descending with derived values and pagination", async () => {
    const env = createEnv([
      createMeasurementRow({
        bodyFatPercentage: 14.46,
        date: "2026-06-10",
        id: "newest",
        musclePercentage: 43.72,
        restingMetabolismKcal: 1700,
        weightKg: 72.9,
      }),
      createMeasurementRow({
        bodyFatPercentage: null,
        date: "2026-06-09",
        id: "middle",
        musclePercentage: null,
        restingMetabolismKcal: null,
        weightKg: 72.1,
      }),
      createMeasurementRow({
        date: "2026-06-08",
        id: "oldest",
        weightKg: 71.8,
      }),
    ])
    const response = await app.request(
      "/api/measurements?limit=2&offset=0",
      {
        headers: {
          cookie: await createSessionCookieHeader(),
        },
      },
      env,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      items: [
        {
          id: "newest",
          date: "2026-06-10",
          weightKg: 72.9,
          bodyFatPercentage: 14.46,
          musclePercentage: 43.72,
          restingMetabolismKcal: 1700,
          waistCm: null,
          sleepHours: null,
          disposition: null,
          notes: null,
          createdAt: "2026-06-09T12:00:00.000Z",
          updatedAt: "2026-06-09T12:00:00.000Z",
          derived: {
            bmi: 25.83,
            bodyFatKg: 10.54,
            muscleKg: 31.87,
          },
        },
        {
          id: "middle",
          date: "2026-06-09",
          weightKg: 72.1,
          bodyFatPercentage: null,
          musclePercentage: null,
          restingMetabolismKcal: null,
          waistCm: null,
          sleepHours: null,
          disposition: null,
          notes: null,
          createdAt: "2026-06-09T12:00:00.000Z",
          updatedAt: "2026-06-09T12:00:00.000Z",
          derived: {
            bmi: 25.55,
            bodyFatKg: null,
            muscleKg: null,
          },
        },
      ],
    })
  })

  it("rejects invalid measurement list query params", async () => {
    const env = createEnv()
    const response = await app.request(
      "/api/measurements?limit=0",
      {
        headers: {
          cookie: await createSessionCookieHeader(),
        },
      },
      env,
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      action: "Revise os filtros de listagem e tente novamente.",
      message: "Parâmetros de listagem inválidos.",
      name: "ValidationError",
      statusCode: 400,
    })
  })

  it("exports measurements as CSV with documented headers and row values", async () => {
    const env = createEnv([
      createMeasurementRow({
        bodyFatPercentage: 14.46,
        date: "2026-06-10",
        id: "newest",
        musclePercentage: 43.72,
        restingMetabolismKcal: 1700,
        waistCm: 81.5,
        sleepHours: 7.5,
        disposition: 4,
        notes: 'Slept well, "no" coffee',
        weightKg: 72.9,
      }),
      createMeasurementRow({
        bodyFatPercentage: null,
        date: "2026-06-09",
        id: "oldest",
        musclePercentage: null,
        restingMetabolismKcal: null,
        weightKg: 72.1,
      }),
    ])
    const response = await app.request(
      "/api/export/csv",
      {
        headers: {
          cookie: await createSessionCookieHeader(),
        },
      },
      env,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8")
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="bodylog-measurements.csv"',
    )
    expect(await response.text()).toBe(
      [
        "date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,waist_cm,sleep_hours,disposition,notes,created_at,updated_at",
        '2026-06-10,72.9,14.46,43.72,1700,81.5,7.5,4,"Slept well, ""no"" coffee",2026-06-09T12:00:00.000Z,2026-06-09T12:00:00.000Z',
        "2026-06-09,72.1,,,,,,,,2026-06-09T12:00:00.000Z,2026-06-09T12:00:00.000Z",
      ].join("\n"),
    )
  })

  it("saves and returns waist, sleep, disposition and trimmed notes", async () => {
    const env = createEnv()
    const putResponse = await putMeasurement(env, {
      disposition: 4,
      notes: "  Slept well  ",
      sleepHours: 7.5,
      waistCm: 81.5,
      weightKg: 72.9,
    })

    expect(putResponse.status).toBe(200)
    expect(await putResponse.json()).toMatchObject({
      item: {
        disposition: 4,
        notes: "Slept well",
        sleepHours: 7.5,
        waistCm: 81.5,
      },
    })

    const loadResponse = await app.request(
      "/api/measurements/by-date/2026-06-10",
      { headers: { cookie: await createSessionCookieHeader() } },
      env,
    )

    expect(await loadResponse.json()).toMatchObject({
      item: {
        disposition: 4,
        notes: "Slept well",
        sleepHours: 7.5,
        waistCm: 81.5,
      },
    })
  })

  it("stores blank notes as null and keeps the new fields optional", async () => {
    const response = await putMeasurement(createEnv(), {
      notes: "   ",
      weightKg: 72.9,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      item: {
        disposition: null,
        notes: null,
        sleepHours: null,
        waistCm: null,
      },
    })
  })

  it.each([
    ["weightKg", 20, 300, 19.9, 300.1],
    ["bodyFatPercentage", 1, 80, 0.9, 80.1],
    ["musclePercentage", 1, 80, 0.9, 80.1],
    ["restingMetabolismKcal", 500, 5000, 499, 5001],
    ["waistCm", 30, 250, 29.9, 250.1],
    ["sleepHours", 0, 24, -0.5, 24.5],
    ["disposition", 1, 5, 0, 6],
  ])(
    "accepts %s at its limits and rejects values outside them",
    async (field, min, max, belowMin, aboveMax) => {
      for (const value of [min, max]) {
        const response = await putMeasurement(createEnv(), {
          weightKg: 72.9,
          [field]: value,
        })

        expect(response.status).toBe(200)
      }

      for (const value of [belowMin, aboveMax]) {
        const response = await putMeasurement(createEnv(), {
          weightKg: 72.9,
          [field]: value,
        })

        expect(response.status).toBe(400)
      }
    },
  )

  it("rejects a non-integer disposition and non-string notes", async () => {
    const disposition = await putMeasurement(createEnv(), {
      disposition: 3.5,
      weightKg: 72.9,
    })
    const notes = await putMeasurement(createEnv(), {
      notes: 42,
      weightKg: 72.9,
    })

    expect(disposition.status).toBe(400)
    expect(notes.status).toBe(400)
  })

  it("deletes a measurement by id", async () => {
    const env = createEnv([
      createMeasurementRow({
        date: "2026-06-10",
        id: "measurement-to-delete",
        weightKg: 72.9,
      }),
    ])
    const response = await app.request(
      "/api/measurements/measurement-to-delete",
      {
        headers: {
          cookie: await createSessionCookieHeader(),
        },
        method: "DELETE",
      },
      env,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
    })

    const loadResponse = await app.request(
      "/api/measurements/by-date/2026-06-10",
      {
        headers: {
          cookie: await createSessionCookieHeader(),
        },
      },
      env,
    )

    expect(loadResponse.status).toBe(404)
  })

  it("returns not found when deleting a missing measurement", async () => {
    const env = createEnv()
    const response = await app.request(
      "/api/measurements/missing-measurement",
      {
        headers: {
          cookie: await createSessionCookieHeader(),
        },
        method: "DELETE",
      },
      env,
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      action: "Atualize o histórico e tente novamente.",
      message: "Medida não encontrada.",
      name: "NotFoundError",
      statusCode: 404,
    })
  })
})

async function putMeasurement(
  env: ReturnType<typeof createEnv>,
  body: Record<string, unknown>,
): Promise<Response> {
  return app.request(
    "/api/measurements/by-date/2026-06-10",
    {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        cookie: await createSessionCookieHeader(),
      },
      method: "PUT",
    },
    env,
  )
}

function createEnv(rows: MeasurementRow[] = []) {
  return {
    ...baseEnv,
    DB: new MeasurementApiD1(rows) as unknown as D1Database,
  }
}

async function createSessionCookieHeader(): Promise<string> {
  const sessionCookieValue = await createSessionCookieValue(
    baseEnv.SESSION_SECRET,
  )

  return `${SESSION_COOKIE_NAME}=${sessionCookieValue}`
}

function createMeasurementRow(input: {
  bodyFatPercentage?: number | null
  date: string
  id: string
  musclePercentage?: number | null
  restingMetabolismKcal?: number | null
  waistCm?: number | null
  sleepHours?: number | null
  disposition?: number | null
  notes?: string | null
  weightKg: number
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
    disposition: input.disposition ?? null,
    notes: input.notes ?? null,
    created_at: "2026-06-09T12:00:00.000Z",
    updated_at: "2026-06-09T12:00:00.000Z",
  }
}

class MeasurementApiD1 {
  private readonly rows = new Map<string, MeasurementRow>()

  constructor(rows: MeasurementRow[]) {
    for (const row of rows) {
      this.rows.set(row.id, row)
    }
  }

  prepare(query: string): MeasurementApiD1Statement {
    return new MeasurementApiD1Statement(this.rows, normalizeSql(query))
  }
}

class MeasurementApiD1Statement {
  private bindings: unknown[] = []
  private readonly query: string
  private readonly rows: Map<string, MeasurementRow>

  constructor(rows: Map<string, MeasurementRow>, query: string) {
    this.rows = rows
    this.query = query
  }

  bind(...bindings: unknown[]): MeasurementApiD1Statement {
    this.bindings = bindings

    return this
  }

  async run(): Promise<D1Result> {
    if (this.query.startsWith("INSERT INTO measurements")) {
      return this.insertMeasurement()
    }

    if (this.query.startsWith("UPDATE measurements")) {
      return this.updateMeasurement()
    }

    if (this.query.startsWith("DELETE FROM measurements")) {
      return this.deleteMeasurement()
    }

    throw new Error(`Unsupported run query: ${this.query}`)
  }

  async first<T>(): Promise<T | null> {
    if (!this.query.includes("FROM measurements WHERE date = ?")) {
      throw new Error(`Unsupported first query: ${this.query}`)
    }

    const date = this.bindings[0]
    const row = [...this.rows.values()].find((item) => item.date === date)

    return (row ?? null) as T | null
  }

  async all<T>(): Promise<D1Result<T>> {
    if (
      !this.query.includes("FROM measurements") ||
      !this.query.includes("ORDER BY date DESC")
    ) {
      throw new Error(`Unsupported all query: ${this.query}`)
    }

    let bindingIndex = 0
    let results = [...this.rows.values()]

    if (this.query.includes("date >= ?")) {
      const from = String(this.bindings[bindingIndex])
      bindingIndex += 1
      results = results.filter((row) => row.date >= from)
    }

    if (this.query.includes("date <= ?")) {
      const to = String(this.bindings[bindingIndex])
      bindingIndex += 1
      results = results.filter((row) => row.date <= to)
    }

    results = results.sort((left, right) => right.date.localeCompare(left.date))

    if (this.query.includes("LIMIT ?")) {
      const limit = Number(this.bindings[bindingIndex])
      bindingIndex += 1
      const offset = this.query.includes("OFFSET ?")
        ? Number(this.bindings[bindingIndex])
        : 0

      results = results.slice(offset, offset + limit)
    } else if (this.query.includes("LIMIT -1 OFFSET ?")) {
      const offset = Number(this.bindings[bindingIndex])

      results = results.slice(offset)
    }

    return createD1Result(0, results as T[])
  }

  private async insertMeasurement(): Promise<D1Result> {
    const [
      id,
      date,
      weightKg,
      bodyFatPercentage,
      musclePercentage,
      restingMetabolismKcal,
      waistCm,
      sleepHours,
      disposition,
      notes,
      createdAt,
      updatedAt,
    ] = this.bindings

    this.rows.set(String(id), {
      id: String(id),
      date: String(date),
      weight_kg: Number(weightKg),
      body_fat_percentage: nullableNumber(bodyFatPercentage),
      muscle_percentage: nullableNumber(musclePercentage),
      resting_metabolism_kcal: nullableNumber(restingMetabolismKcal),
      waist_cm: nullableNumber(waistCm),
      sleep_hours: nullableNumber(sleepHours),
      disposition: nullableNumber(disposition),
      notes: notes === null || notes === undefined ? null : String(notes),
      created_at: String(createdAt),
      updated_at: String(updatedAt),
    })

    return createD1Result(1)
  }

  private async updateMeasurement(): Promise<D1Result> {
    const [
      weightKg,
      bodyFatPercentage,
      musclePercentage,
      restingMetabolismKcal,
      waistCm,
      sleepHours,
      disposition,
      notes,
      updatedAt,
      date,
    ] = this.bindings
    const row = [...this.rows.values()].find((item) => item.date === date)

    if (!row) {
      return createD1Result(0)
    }

    this.rows.set(row.id, {
      ...row,
      weight_kg: Number(weightKg),
      body_fat_percentage: nullableNumber(bodyFatPercentage),
      muscle_percentage: nullableNumber(musclePercentage),
      resting_metabolism_kcal: nullableNumber(restingMetabolismKcal),
      waist_cm: nullableNumber(waistCm),
      sleep_hours: nullableNumber(sleepHours),
      disposition: nullableNumber(disposition),
      notes: notes === null || notes === undefined ? null : String(notes),
      updated_at: String(updatedAt),
    })

    return createD1Result(1)
  }

  private async deleteMeasurement(): Promise<D1Result> {
    const id = this.bindings[0]
    const deleted = this.rows.delete(String(id))

    return createD1Result(deleted ? 1 : 0)
  }
}

function normalizeSql(query: string): string {
  return query.replace(/\s+/g, " ").trim()
}

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value)
}

function createD1Result<T = unknown>(
  changes: number,
  results: T[] = [],
): D1Result<T> {
  return {
    results,
    success: true,
    meta: {
      changed_db: false,
      changes,
      duration: 0,
      last_row_id: 0,
      rows_read: results.length,
      rows_written: changes,
      size_after: 0,
    },
  } as D1Result<T>
}
