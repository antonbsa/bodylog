import { describe, expect, it } from "vitest"

import { MeasurementRepository } from "../../apps/api/src/db/repositories/measurements"
import { createTestEnv } from "./test-env"

describe("MeasurementRepository", () => {
  it("creates a measurement", async () => {
    const db = createDb()
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
    const db = createDb()
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
    const repository = createRepository(createDb())

    await expect(
      repository.updateByDate("2026-06-09", {
        weightKg: 72.9,
      }),
    ).resolves.toBeNull()
  })

  it("round-trips waist, sleep, disposition and notes", async () => {
    let now = "2026-06-10T12:00:00.000Z"
    const repository = createRepository(createDb(), {
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
    const db = createDb()

    db.insertMeasurement(USER_ID, {
      id: "old",
      date: "2026-05-01",
      weight_kg: 75,
      created_at: "2026-05-01T12:00:00.000Z",
    })

    expect(await createRepository(db).getByDate("2026-05-01")).toMatchObject({
      waistCm: null,
      sleepHours: null,
      disposition: null,
      notes: null,
    })
  })

  it("gets a measurement by date", async () => {
    const repository = createRepository(createDb())

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
    const repository = createRepository(createDb())

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
    const repository = createRepository(createDb())

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

  it("returns the latest measurement before a date with to and limit 1", async () => {
    const repository = createRepository(createDb())

    for (const date of ["2026-06-05", "2026-06-08", "2026-06-10"]) {
      await repository.create({ date, weightKg: 72 })
    }

    const measurements = await repository.list({
      limit: 1,
      to: "2026-06-09",
    })

    expect(measurements.map((measurement) => measurement.date)).toEqual([
      "2026-06-08",
    ])
  })

  it("deletes a measurement", async () => {
    const repository = createRepository(createDb())
    const measurement = await repository.create({
      date: "2026-06-09",
      weightKg: 72.9,
    })

    await expect(repository.delete(measurement.id)).resolves.toBe(true)
    await expect(repository.getByDate("2026-06-09")).resolves.toBeNull()
    await expect(repository.delete(measurement.id)).resolves.toBe(false)
  })
})

const USER_ID = "user-a"

function createDb() {
  const testEnv = createTestEnv()

  testEnv.createUser(USER_ID)

  return testEnv
}

function createRepository(
  db: ReturnType<typeof createDb>,
  options: {
    now?: () => Date
  } = {},
): MeasurementRepository {
  return new MeasurementRepository(db.env.DB, USER_ID, {
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
