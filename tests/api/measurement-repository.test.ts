import { describe, expect, it } from "vitest"

import { MeasurementRepository } from "../../apps/api/src/measurements/measurement-repository"

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

describe("MeasurementRepository", () => {
  it("creates a measurement", async () => {
    const db = new InMemoryMeasurementD1()
    const repository = createRepository(db)

    const measurement = await repository.create({
      date: "2026-06-09",
      weightKg: 72.9,
    })

    expect(measurement).toEqual({
      id: "measurement-1",
      date: "2026-06-09",
      weightKg: 72.9,
      bodyFatPercentage: null,
      musclePercentage: null,
      restingMetabolismKcal: null,
      waistCm: null,
      sleepHours: null,
      disposition: null,
      notes: null,
      createdAt: "2026-06-10T12:00:00.000Z",
      updatedAt: "2026-06-10T12:00:00.000Z",
    })
    expect(await repository.getByDate("2026-06-09")).toEqual(measurement)
  })

  it("updates a measurement by date", async () => {
    const db = new InMemoryMeasurementD1()
    let now = "2026-06-10T12:00:00.000Z"
    const repository = createRepository(db, {
      now: () => new Date(now),
    })

    await repository.create({
      date: "2026-06-09",
      weightKg: 72.9,
      bodyFatPercentage: 14.46,
    })

    now = "2026-06-11T12:00:00.000Z"

    const updated = await repository.updateByDate("2026-06-09", {
      weightKg: 73.1,
      musclePercentage: 43.72,
      restingMetabolismKcal: 1700,
    })

    expect(updated).toEqual({
      id: "measurement-1",
      date: "2026-06-09",
      weightKg: 73.1,
      bodyFatPercentage: null,
      musclePercentage: 43.72,
      restingMetabolismKcal: 1700,
      waistCm: null,
      sleepHours: null,
      disposition: null,
      notes: null,
      createdAt: "2026-06-10T12:00:00.000Z",
      updatedAt: "2026-06-11T12:00:00.000Z",
    })
  })

  it("returns null when updating a missing date", async () => {
    const repository = createRepository(new InMemoryMeasurementD1())

    await expect(
      repository.updateByDate("2026-06-09", {
        weightKg: 72.9,
      }),
    ).resolves.toBeNull()
  })

  it("round-trips waist, sleep, disposition and notes", async () => {
    let now = "2026-06-10T12:00:00.000Z"
    const repository = createRepository(new InMemoryMeasurementD1(), {
      now: () => new Date(now),
    })

    const created = await repository.create({
      date: "2026-06-09",
      weightKg: 72.9,
      waistCm: 81.5,
      sleepHours: 7.5,
      disposition: 4,
      notes: "Slept well",
    })

    expect(created).toMatchObject({
      waistCm: 81.5,
      sleepHours: 7.5,
      disposition: 4,
      notes: "Slept well",
    })
    expect(await repository.getByDate("2026-06-09")).toEqual(created)

    now = "2026-06-11T12:00:00.000Z"

    const updated = await repository.updateByDate("2026-06-09", {
      weightKg: 73,
      waistCm: 80,
      sleepHours: 0,
      disposition: 1,
      notes: null,
    })

    expect(updated).toMatchObject({
      waistCm: 80,
      sleepHours: 0,
      disposition: 1,
      notes: null,
    })
    expect((await repository.list())[0]).toEqual(updated)
  })

  it("reads rows without the new columns set as null", async () => {
    const db = new InMemoryMeasurementD1()

    db.rows.set("old", {
      id: "old",
      date: "2026-05-01",
      weight_kg: 75,
      body_fat_percentage: null,
      muscle_percentage: null,
      resting_metabolism_kcal: null,
      waist_cm: null,
      sleep_hours: null,
      disposition: null,
      notes: null,
      created_at: "2026-05-01T12:00:00.000Z",
      updated_at: "2026-05-01T12:00:00.000Z",
    })

    expect(await createRepository(db).getByDate("2026-05-01")).toMatchObject({
      waistCm: null,
      sleepHours: null,
      disposition: null,
      notes: null,
    })
  })

  it("gets a measurement by date", async () => {
    const repository = createRepository(new InMemoryMeasurementD1())

    await repository.create({
      date: "2026-06-09",
      weightKg: 72.9,
      bodyFatPercentage: 14.46,
      musclePercentage: 43.72,
      restingMetabolismKcal: 1700,
    })

    expect(await repository.getByDate("2026-06-09")).toMatchObject({
      date: "2026-06-09",
      weightKg: 72.9,
      bodyFatPercentage: 14.46,
      musclePercentage: 43.72,
      restingMetabolismKcal: 1700,
    })
    expect(await repository.getByDate("2026-06-10")).toBeNull()
  })

  it("lists measurements by date descending", async () => {
    const repository = createRepository(new InMemoryMeasurementD1())

    await repository.create({
      date: "2026-06-08",
      weightKg: 72.1,
    })
    await repository.create({
      date: "2026-06-10",
      weightKg: 73.2,
    })
    await repository.create({
      date: "2026-06-09",
      weightKg: 72.9,
    })

    const measurements = await repository.list()

    expect(measurements.map((measurement) => measurement.date)).toEqual([
      "2026-06-10",
      "2026-06-09",
      "2026-06-08",
    ])
  })

  it("lists measurements with date filters and pagination", async () => {
    const repository = createRepository(new InMemoryMeasurementD1())

    await repository.create({
      date: "2026-06-07",
      weightKg: 71.8,
    })
    await repository.create({
      date: "2026-06-08",
      weightKg: 72.1,
    })
    await repository.create({
      date: "2026-06-09",
      weightKg: 72.9,
    })
    await repository.create({
      date: "2026-06-10",
      weightKg: 73.2,
    })

    const measurements = await repository.list({
      from: "2026-06-08",
      limit: 1,
      offset: 1,
      to: "2026-06-10",
    })

    expect(measurements.map((measurement) => measurement.date)).toEqual([
      "2026-06-09",
    ])
  })

  it("deletes a measurement", async () => {
    const repository = createRepository(new InMemoryMeasurementD1())
    const measurement = await repository.create({
      date: "2026-06-09",
      weightKg: 72.9,
    })

    await expect(repository.delete(measurement.id)).resolves.toBe(true)
    await expect(repository.getByDate("2026-06-09")).resolves.toBeNull()
    await expect(repository.delete(measurement.id)).resolves.toBe(false)
  })
})

function createRepository(
  db: InMemoryMeasurementD1,
  options: {
    now?: () => Date
  } = {},
): MeasurementRepository {
  return new MeasurementRepository(db as unknown as D1Database, {
    createId: createSequentialId(),
    now: options.now ?? (() => new Date("2026-06-10T12:00:00.000Z")),
  })
}

function createSequentialId(): () => string {
  let currentId = 0

  return () => {
    currentId += 1

    return `measurement-${currentId}`
  }
}

class InMemoryMeasurementD1 {
  readonly rows = new Map<string, MeasurementRow>()

  prepare(query: string): InMemoryD1Statement {
    return new InMemoryD1Statement(this, normalizeSql(query))
  }
}

class InMemoryD1Statement {
  private bindings: unknown[] = []
  private readonly db: InMemoryMeasurementD1
  private readonly query: string

  constructor(db: InMemoryMeasurementD1, query: string) {
    this.db = db
    this.query = query
  }

  bind(...bindings: unknown[]): InMemoryD1Statement {
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
    const row = [...this.db.rows.values()].find((item) => item.date === date)

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
    let results = [...this.db.rows.values()]

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

    return createD1Result(results as T[])
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

    if ([...this.db.rows.values()].some((row) => row.date === date)) {
      throw new Error(`UNIQUE constraint failed: measurements.date`)
    }

    this.db.rows.set(String(id), {
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

    return createD1Result([], 1)
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
    const row = [...this.db.rows.values()].find((item) => item.date === date)

    if (!row) {
      return createD1Result([], 0)
    }

    this.db.rows.set(row.id, {
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

    return createD1Result([], 1)
  }

  private async deleteMeasurement(): Promise<D1Result> {
    const id = String(this.bindings[0])
    const deleted = this.db.rows.delete(id)

    return createD1Result([], deleted ? 1 : 0)
  }
}

function normalizeSql(query: string): string {
  return query.replace(/\s+/g, " ").trim()
}

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value)
}

function createD1Result<T = unknown>(
  results: T[] = [],
  changes = 0,
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
