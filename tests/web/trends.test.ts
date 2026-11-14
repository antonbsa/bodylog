import { describe, expect, it } from "vitest"

import { getVariationChip } from "../../apps/web/src/utils/dashboard-summary"
import {
  MIN_TREND_POINTS,
  TREND_METRICS,
  getMetricPoints,
  getPeriodAverage,
  getTrendWindow,
  getWeekStart,
  getWeeklyAverages,
  getWindowChip,
  getYAxis,
  type MetricPoint,
} from "../../apps/web/src/utils/trends"
import type { TrendPoint } from "../../types/trends"

const TODAY = "2026-11-13"
const weight = TREND_METRICS[0]
const metabolism = TREND_METRICS[6]

function point(date: string, overrides: Partial<TrendPoint> = {}): TrendPoint {
  return {
    bmi: null,
    bodyFatPercentage: null,
    date,
    disposition: null,
    musclePercentage: null,
    restingMetabolismKcal: null,
    sleepHours: null,
    waistCm: null,
    weightKg: 72,
    ...overrides,
  }
}

function values(...entries: Array<[string, number]>): MetricPoint[] {
  return entries.map(([date, value]) => ({ date, value }))
}

describe("getMetricPoints", () => {
  it("keeps only days that have the metric", () => {
    const points = [
      point("2026-11-01", { waistCm: 80 }),
      point("2026-11-02"),
      point("2026-11-03", { waistCm: 0 }),
    ]

    expect(getMetricPoints(points, "waistCm")).toEqual(
      values(["2026-11-01", 80], ["2026-11-03", 0]),
    )
  })
})

describe("getTrendWindow", () => {
  const history = values(
    ["2026-01-05", 75],
    ["2026-10-20", 74],
    ["2026-11-01", 73],
    ["2026-11-13", 72],
  )

  it("covers the last N days including today", () => {
    const window = getTrendWindow(history, "14", TODAY)

    expect(window.start).toBe("2026-10-31")
    expect(window.end).toBe(TODAY)
    expect(window.clipped).toBe(false)
    expect(window.points.map((item) => item.date)).toEqual([
      "2026-11-01",
      "2026-11-13",
    ])
  })

  it("clips to the first record when history is shorter than the period", () => {
    const window = getTrendWindow(
      values(["2026-11-01", 73], ["2026-11-13", 72]),
      "90",
      TODAY,
    )

    expect(window.clipped).toBe(true)
    expect(window.start).toBe("2026-11-01")
    expect(window.firstDate).toBe("2026-11-01")
  })

  it("does not clip when the first record is before the window start", () => {
    const window = getTrendWindow(
      values(["2025-06-01", 76], ["2026-11-13", 72]),
      "365",
      TODAY,
    )

    expect(window.clipped).toBe(false)
    expect(window.start).toBe("2025-11-14")
  })

  it("starts Tudo at the first record without clipping", () => {
    const window = getTrendWindow(history, "all", TODAY)

    expect(window.start).toBe("2026-01-05")
    expect(window.clipped).toBe(false)
    expect(window.points).toHaveLength(4)
  })

  it("ignores records after today and handles no data", () => {
    const future = values(["2026-11-14", 70])

    expect(getTrendWindow(future, "30", TODAY).points).toEqual([])
    expect(getTrendWindow([], "30", TODAY).firstDate).toBeNull()
    expect(getTrendWindow([], "all", TODAY).start).toBe("2026-10-31")
  })

  it("flags fewer than the minimum points", () => {
    const window = getTrendWindow(
      values(["2026-11-12", 72], ["2026-11-13", 72]),
      "30",
      TODAY,
    )

    expect(window.points.length).toBeLessThan(MIN_TREND_POINTS)
  })
})

describe("weekly averages", () => {
  const points = values(
    ["2026-11-02", 74],
    ["2026-11-08", 73],
    ["2026-11-09", 72],
    ["2026-11-11", 71],
    ["2026-11-13", 70],
  )

  it("finds the Monday of a week", () => {
    expect(getWeekStart("2026-11-08")).toBe("2026-11-02")
    expect(getWeekStart("2026-11-09")).toBe("2026-11-09")
    expect(getWeekStart("2026-11-15")).toBe("2026-11-09")
  })

  it("averages each Monday-start week and positions it at the mean day", () => {
    const weeks = getWeeklyAverages(points, "2026-11-02")

    expect(weeks.map((week) => week.weekStartDate)).toEqual([
      "2026-11-02",
      "2026-11-09",
    ])
    expect(weeks[0]).toMatchObject({
      average: 73.5,
      count: 2,
      offset: 3,
      weekEndDate: "2026-11-08",
    })
    expect(weeks[1]?.average).toBeCloseTo(71, 5)
    expect(weeks[1]?.offset).toBeCloseTo(9, 5)
  })

  it("averages the whole period over the in-window points", () => {
    expect(getPeriodAverage(points)).toBeCloseTo(72, 5)
  })
})

describe("getWindowChip", () => {
  function weeks(first: number, last: number) {
    return getWeeklyAverages(
      values(["2026-11-02", first], ["2026-11-10", last]),
      "2026-11-02",
    )
  }

  it("compares the last week against the first", () => {
    expect(getWindowChip(weeks(74, 72.6), weight)).toEqual({
      direction: "down",
      text: "Caiu 1,4 kg",
    })
  })

  it("has no comparison with fewer than two weeks", () => {
    expect(
      getWindowChip(
        getWeeklyAverages(values(["2026-11-02", 74]), "2026-11-02"),
        weight,
      ),
    ).toEqual({ direction: "none", text: "Sem comparação" })
  })

  it("is stable when the change rounds to zero at the displayed precision", () => {
    expect(getWindowChip(weeks(72.04, 72.01), weight).text).toBe("Estável")
  })

  it("uses whole numbers for metabolism", () => {
    expect(getWindowChip(weeks(1650.4, 1650.1), metabolism).text).toBe(
      "Estável",
    )
    expect(getWindowChip(weeks(1650, 1712), metabolism)).toEqual({
      direction: "up",
      text: "Subiu 62 kcal",
    })
  })

  it("keeps the one-decimal default for existing callers", () => {
    expect(getVariationChip(1650.4, 1650.1, "kcal").text).toBe("Subiu 0,3 kcal")
  })
})

describe("getYAxis", () => {
  it("widens a flat series and returns nice ticks", () => {
    const axis = getYAxis([72, 72])

    expect(axis.min).toBeLessThanOrEqual(71.5)
    expect(axis.max).toBeGreaterThanOrEqual(72.5)
    expect(axis.ticks.length).toBeGreaterThan(1)
  })

  it("rounds the range out to the step", () => {
    const axis = getYAxis([71.2, 74.6])

    expect(axis.step).toBe(1)
    expect(axis.ticks).toEqual([71, 72, 73, 74, 75])
  })
})
