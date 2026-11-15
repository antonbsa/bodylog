import { describe, expect, it } from "vitest"

import {
  appendDigit,
  deleteDigit,
  digitsFromFieldValue,
  digitsFromPastedText,
  formatMaskedDigits,
  maskedDigitsToNumber,
  numberToMaskedDigits,
} from "../../apps/web/src/utils/numeric-mask"

function type(text: string, maxDigits = 4, start = ""): string {
  return [...text].reduce(
    (digits, character) => appendDigit(digits, character, maxDigits),
    start,
  )
}

describe("numeric mask", () => {
  it("fills digits from the right with a fixed decimal", () => {
    expect(formatMaskedDigits(type("724"), 1)).toBe("72,4")
    expect(formatMaskedDigits(type("7"), 1)).toBe("0,7")
    expect(formatMaskedDigits("", 1)).toBe("")
    expect(formatMaskedDigits(type("1700"), 0)).toBe("1700")
  })

  it("drops leading zeros but keeps a lone zero", () => {
    expect(type("0072")).toBe("72")
    expect(type("0")).toBe("0")
    expect(formatMaskedDigits(type("0"), 1)).toBe("0,0")
  })

  it("caps the digit count", () => {
    expect(type("72456", 4)).toBe("7245")
    expect(type("2405", 3)).toBe("240")
  })

  it("ignores non-digit characters", () => {
    expect(type("7a,2")).toBe("72")
  })

  it("deletes the last digit, or clears over a selection", () => {
    expect(deleteDigit("724", false)).toBe("72")
    expect(deleteDigit("7", false)).toBe("")
    expect(deleteDigit("", false)).toBe("")
    expect(deleteDigit("724", true)).toBe("")
  })

  it("fills from pasted text with a dot or a comma", () => {
    expect(digitsFromPastedText("72.4", 1, 4)).toBe("724")
    expect(digitsFromPastedText("72,4", 1, 4)).toBe("724")
    expect(digitsFromPastedText(" 72 ", 1, 4)).toBe("720")
    expect(digitsFromPastedText("1700", 0, 4)).toBe("1700")
    expect(digitsFromPastedText("72,46", 1, 4)).toBe("725")
  })

  it("rejects pasted text that is not a number or does not fit", () => {
    expect(digitsFromPastedText("abc", 1, 4)).toBeNull()
    expect(digitsFromPastedText("-72,4", 1, 4)).toBeNull()
    expect(digitsFromPastedText("7245,0", 1, 4)).toBeNull()
  })

  it("takes the digits of a browser-applied value, keeping the old digits past the cap", () => {
    expect(digitsFromFieldValue("72,4", "", 4)).toBe("724")
    expect(digitsFromFieldValue("0072", "", 4)).toBe("72")
    expect(digitsFromFieldValue("123456", "1234", 4)).toBe("1234")
    expect(digitsFromFieldValue("", "724", 4)).toBe("")
  })

  it("converts between digits and numbers", () => {
    expect(maskedDigitsToNumber("724", 1)).toBe(72.4)
    expect(maskedDigitsToNumber("1700", 0)).toBe(1700)
    expect(maskedDigitsToNumber("", 1)).toBeNull()
    expect(numberToMaskedDigits(72.4, 1)).toBe("724")
    expect(numberToMaskedDigits(0, 1)).toBe("0")
    expect(numberToMaskedDigits(null, 1)).toBe("")
  })
})
