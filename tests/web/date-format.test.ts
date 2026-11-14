import { describe, expect, it } from "vitest"

import {
  formatDayLabel,
  formatDayMonth,
  getMonthRange,
  getTodayIsoDate,
  isPastOrTodayIsoDate,
  parseIsoDate,
  shiftIsoDate,
  toIsoDate,
} from "../../apps/web/src/utils/date-format"

describe("registration date helpers", () => {
  it("shifts a date by whole days across month and year ends", () => {
    expect(shiftIsoDate("2026-03-01", -1)).toBe("2026-02-28")
    expect(shiftIsoDate("2026-12-31", 1)).toBe("2027-01-01")
  })

  it("formats the date bar label and the DD/MM form", () => {
    expect(formatDayLabel("2026-11-12")).toBe("qui, 12 nov")
    expect(formatDayMonth("2026-06-10")).toBe("10/06")
  })

  it("accepts only real dates up to today", () => {
    const today = getTodayIsoDate()

    expect(isPastOrTodayIsoDate(today)).toBe(true)
    expect(isPastOrTodayIsoDate("2026-06-10")).toBe(true)
    expect(isPastOrTodayIsoDate(shiftIsoDate(today, 1))).toBe(false)
    expect(isPastOrTodayIsoDate("2026-02-31")).toBe(false)
    expect(isPastOrTodayIsoDate("10/06/2026")).toBe(false)
    expect(isPastOrTodayIsoDate(null)).toBe(false)
  })
})

describe("calendar date helpers", () => {
  it("round-trips an ISO date through a local Date", () => {
    expect(toIsoDate(parseIsoDate("2026-03-01"))).toBe("2026-03-01")
    expect(toIsoDate(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31")
  })

  it("gives the first and last day of a month, including leap February", () => {
    expect(getMonthRange(parseIsoDate("2026-11-13"))).toEqual({
      from: "2026-11-01",
      to: "2026-11-30",
    })
    expect(getMonthRange(parseIsoDate("2028-02-10"))).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    })
  })
})
