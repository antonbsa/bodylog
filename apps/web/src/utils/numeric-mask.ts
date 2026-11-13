/**
 * Right-to-left digit mask: the field state is only the digits ("724") and the
 * decimal comma is inserted on display ("72,4").
 */

const LEADING_ZEROS = /^0+(?=\d)/

/** Formats the stored digits for display, for example `"724"` with 1 decimal to `"72,4"`. */
export function formatMaskedDigits(digits: string, decimals: number): string {
  if (digits === "") {
    return ""
  }

  if (decimals === 0) {
    return digits
  }

  const padded = digits.padStart(decimals + 1, "0")

  return `${padded.slice(0, -decimals)},${padded.slice(-decimals)}`
}

export function maskedDigitsToNumber(
  digits: string,
  decimals: number,
): number | null {
  return digits === "" ? null : Number(digits) / 10 ** decimals
}

export function numberToMaskedDigits(
  value: number | null,
  decimals: number,
): string {
  return value === null ? "" : String(Math.round(value * 10 ** decimals))
}

/** A typed digit always appends, wherever the caret is; other characters and digits past the cap are ignored. */
export function appendDigit(
  digits: string,
  character: string,
  maxDigits: number,
): string {
  if (!/^\d$/.test(character)) {
    return digits
  }

  const next = `${digits}${character}`.replace(LEADING_ZEROS, "")

  return next.length > maxDigits ? digits : next
}

/** Delete removes the last digit; over a selection it clears the field. */
export function deleteDigit(digits: string, hasSelection: boolean): string {
  return hasSelection ? "" : digits.slice(0, -1)
}

/**
 * Digits for a pasted number such as `72,4` or `72.4`. Returns null when the
 * text is not a plain number or does not fit the cap, so the paste is ignored.
 */
export function digitsFromPastedText(
  text: string,
  decimals: number,
  maxDigits: number,
): string | null {
  const normalized = text.replace(/\s/g, "")

  if (!/^\d+([.,]\d+)?$/.test(normalized)) {
    return null
  }

  const digits = String(
    Math.round(parseFloat(normalized.replace(",", ".")) * 10 ** decimals),
  )

  return digits.length > maxDigits ? null : digits
}

/** Fallback for edits the browser applies itself (autofill, voice input): keep the digits of the new value. */
export function digitsFromFieldValue(
  value: string,
  previousDigits: string,
  maxDigits: number,
): string {
  const digits = value.replace(/\D/g, "").replace(LEADING_ZEROS, "")

  return digits.length > maxDigits ? previousDigits : digits
}
