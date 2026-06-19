import { describe, expect, it } from "vitest"

import { getWeekRange } from "../../apps/api/src/domain/week-range"

describe("getWeekRange", () => {
  it("uses Monday-to-Sunday week boundaries", () => {
    expect(getWeekRange("2026-06-10")).toEqual({
      weekStartDate: "2026-06-08",
      weekEndDate: "2026-06-14",
    })
    expect(getWeekRange("2026-06-14")).toEqual({
      weekStartDate: "2026-06-08",
      weekEndDate: "2026-06-14",
    })
    expect(getWeekRange("2026-06-15")).toEqual({
      weekStartDate: "2026-06-15",
      weekEndDate: "2026-06-21",
    })
  })
})
