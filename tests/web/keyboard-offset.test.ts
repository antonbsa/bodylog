import { describe, expect, it } from "vitest"

import { isKeyboardOpen } from "../../apps/web/src/utils/keyboard-offset"

describe("keyboard detection", () => {
  it("is closed when the visual viewport fills the layout viewport", () => {
    expect(isKeyboardOpen({ innerHeight: 844, viewportHeight: 844 })).toBe(
      false,
    )
  })

  it("does not read a small height change as a keyboard", () => {
    expect(isKeyboardOpen({ innerHeight: 844, viewportHeight: 764 })).toBe(
      false,
    )
  })

  it("is open when the visual viewport is keyboard-sized shorter", () => {
    expect(isKeyboardOpen({ innerHeight: 844, viewportHeight: 500 })).toBe(true)
  })
})
