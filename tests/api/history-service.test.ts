import { describe, expect, it } from "vitest"

import { Measurement } from "../../apps/api/src/domain/measurement"
import {
  HISTORY_PAGE_WEEKS,
  getHistoryWeeks,
  type HistoryRepository,
} from "../../apps/api/src/features/history/history-service"
import { shiftIsoDate } from "../../apps/web/src/utils/date-format"

const CONFIG = { currentDate: "2026-06-10", heightCm: 168 }

describe("getHistoryWeeks", () => {
  it("groups records by Monday-based week, newest week and record first", async () => {
    const page = await getHistoryWeeks(
      repositoryFor([
        measurement({ date: "2026-06-07", weightKg: 73 }),
        measurement({ date: "2026-06-08", weightKg: 74 }),
        measurement({ date: "2026-06-01", weightKg: 71 }),
        measurement({ date: "2026-06-10", weightKg: 72 }),
      ]),
      CONFIG,
    )

    expect(page.weeks.map((week) => week.summary.weekStartDate)).toEqual([
      "2026-06-08",
      "2026-06-01",
    ])
    expect(page.weeks[0]?.measurements.map((item) => item.date)).toEqual([
      "2026-06-10",
      "2026-06-08",
    ])
    expect(page.weeks[1]?.measurements.map((item) => item.date)).toEqual([
      "2026-06-07",
      "2026-06-01",
    ])
    expect(page.weeks[0]?.measurements[0]?.derived.bmi).toBeGreaterThan(0)
    expect(page.nextBefore).toBeNull()
  })

  it("computes averages, counts and flags like the weekly dashboard", async () => {
    const page = await getHistoryWeeks(
      repositoryFor([
        measurement({
          bodyFatPercentage: 14,
          date: "2026-06-08",
          weightKg: 74,
        }),
        measurement({ date: "2026-06-10", weightKg: 72 }),
        measurement({ date: "2026-06-07", weightKg: 73 }),
      ]),
      CONFIG,
    )
    const [current, previous] = page.weeks.map((week) => week.summary)

    expect(current?.measurementCount).toBe(2)
    expect(current?.recordedDates).toEqual(["2026-06-08", "2026-06-10"])
    expect(current?.averages.weightKg).toBe(73)
    expect(current?.averages.bodyFatPercentage).toBe(14)
    expect(current?.isCurrentWeek).toBe(true)
    expect(current?.isPartialWeek).toBe(true)
    expect(previous?.measurementCount).toBe(1)
    expect(previous?.isCurrentWeek).toBe(false)
    expect(previous?.isPartialWeek).toBe(false)
  })

  it("skips weeks without records", async () => {
    const page = await getHistoryWeeks(
      repositoryFor([
        measurement({ date: "2026-06-10", weightKg: 72 }),
        measurement({ date: "2026-05-20", weightKg: 70 }),
      ]),
      CONFIG,
    )

    expect(page.weeks.map((week) => week.summary.weekStartDate)).toEqual([
      "2026-06-08",
      "2026-05-18",
    ])
  })

  it("pages by week and continues from nextBefore without splitting a week", async () => {
    const measurements = Array.from({ length: 10 }, (_, index) => [
      measurement({
        date: shiftIsoDate("2026-06-08", -7 * index),
        weightKg: 70,
      }),
      measurement({
        date: shiftIsoDate("2026-06-10", -7 * index),
        weightKg: 72,
      }),
    ]).flat()
    const repository = repositoryFor(measurements)

    const first = await getHistoryWeeks(repository, CONFIG)

    expect(first.weeks).toHaveLength(HISTORY_PAGE_WEEKS)
    expect(first.weeks.every((week) => week.measurements.length === 2)).toBe(
      true,
    )
    expect(first.nextBefore).toBe("2026-04-20")

    const second = await getHistoryWeeks(repository, {
      ...CONFIG,
      before: first.nextBefore ?? undefined,
    })

    expect(second.weeks.map((week) => week.summary.weekStartDate)).toEqual([
      "2026-04-13",
      "2026-04-06",
    ])
    expect(second.nextBefore).toBeNull()
  })

  it("excludes records on or after before", async () => {
    const page = await getHistoryWeeks(
      repositoryFor([
        measurement({ date: "2026-06-08", weightKg: 74 }),
        measurement({ date: "2026-06-07", weightKg: 73 }),
      ]),
      { ...CONFIG, before: "2026-06-08" },
    )

    expect(page.weeks).toHaveLength(1)
    expect(page.weeks[0]?.measurements.map((item) => item.date)).toEqual([
      "2026-06-07",
    ])
  })

  it("applies the before bound in the repository query", async () => {
    const calls: unknown[] = []
    const repository: HistoryRepository = {
      list: async (options) => {
        calls.push(options)
        return []
      },
    }

    await getHistoryWeeks(repository, { ...CONFIG, before: "2026-06-08" })
    await getHistoryWeeks(repository, CONFIG)

    expect(calls).toEqual([{ before: "2026-06-08" }, { before: undefined }])
  })

  it("returns an empty page when there are no records", async () => {
    expect(await getHistoryWeeks(repositoryFor([]), CONFIG)).toEqual({
      nextBefore: null,
      weeks: [],
    })
  })
})

function repositoryFor(measurements: Measurement[]): HistoryRepository {
  return {
    list: async (options) =>
      measurements.filter(
        (item) => !options?.before || item.date < options.before,
      ),
  }
}

function measurement(input: {
  bodyFatPercentage?: number | null
  date: string
  weightKg: number
}): Measurement {
  return new Measurement({
    id: `measurement-${input.date}`,
    date: input.date,
    weightKg: input.weightKg,
    bodyFatPercentage: input.bodyFatPercentage ?? null,
    musclePercentage: null,
    restingMetabolismKcal: null,
    waistCm: null,
    sleepHours: null,
    disposition: null,
    notes: null,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  })
}
