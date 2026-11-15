import { describe, expect, it } from "vitest"

import {
  WEEKLY_METRICS,
  getVariationChip,
  getWeekDays,
} from "../../apps/web/src/utils/dashboard-summary"
import type { WeekSummary } from "../../types/dashboard"

describe("getVariationChip", () => {
  it("shows the direction word and the magnitude with the unit", () => {
    expect(getVariationChip(73.4, 73, "kg")).toEqual({
      direction: "up",
      text: "Subiu 0,4 kg",
    })
    expect(getVariationChip(14.2, 14.5, "p.p.")).toEqual({
      direction: "down",
      text: "Caiu 0,3 p.p.",
    })
  })

  it("uses the unit of each metric", () => {
    const units = Object.fromEntries(
      WEEKLY_METRICS.map((metric) => [metric.key, metric.changeUnit]),
    )

    expect(units).toEqual({
      bodyFatPercentage: "p.p.",
      disposition: "pts",
      musclePercentage: "p.p.",
      sleepHours: "h",
      waistCm: "cm",
      weightKg: "kg",
    })
    expect(getVariationChip(81, 82.5, units.waistCm)).toMatchObject({
      text: "Caiu 1,5 cm",
    })
    expect(getVariationChip(7.5, 7, units.sleepHours)).toMatchObject({
      text: "Subiu 0,5 h",
    })
    expect(getVariationChip(4, 3, units.disposition)).toMatchObject({
      text: "Subiu 1,0 pts",
    })
  })

  it("is stable when the change rounds to zero at one decimal", () => {
    expect(getVariationChip(73.04, 73, "kg")).toEqual({
      direction: "stable",
      text: "Estável",
    })
    expect(getVariationChip(72.96, 73, "kg").direction).toBe("stable")
    expect(getVariationChip(73, 73, "kg").direction).toBe("stable")
  })

  it("compares the rounded values, so a visible 0,1 change is not stable", () => {
    expect(getVariationChip(73.06, 73.04, "kg")).toMatchObject({
      direction: "up",
      text: "Subiu 0,1 kg",
    })
  })

  it("has no comparison when either week lacks the metric", () => {
    const none = { direction: "none", text: "Sem comparação" }

    expect(getVariationChip(null, 73, "kg")).toEqual(none)
    expect(getVariationChip(73, null, "kg")).toEqual(none)
    expect(getVariationChip(undefined, 73, "kg")).toEqual(none)
    expect(getVariationChip(73, undefined, "kg")).toEqual(none)
  })
})

describe("getWeekDays", () => {
  const week = {
    recordedDates: ["2026-11-09", "2026-11-11"],
    weekStartDate: "2026-11-09",
  } as WeekSummary

  it("lists Monday to Sunday with their letters", () => {
    const days = getWeekDays(week, "2026-11-12")

    expect(days.map((day) => day.letter).join("")).toBe("STQQSSD")
    expect(days[0].date).toBe("2026-11-09")
    expect(days[6].date).toBe("2026-11-15")
  })

  it("marks recorded, missing and future days and flags today", () => {
    const days = getWeekDays(week, "2026-11-12")

    expect(days.map((day) => day.status)).toEqual([
      "recorded",
      "missing",
      "recorded",
      "missing",
      "future",
      "future",
      "future",
    ])
    expect(days.filter((day) => day.isToday).map((day) => day.date)).toEqual([
      "2026-11-12",
    ])
  })
})
