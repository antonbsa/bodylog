/** Real calendar date from `YYYY-MM-DD` or `D/M/YYYY`, returned as `YYYY-MM-DD`; null otherwise. Years are never deduced. */
export function parseCsvDate(value: string): string | null {
  const text = value.trim()
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  const brazilian = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text)
  const [year, month, day] = iso
    ? [iso[1], iso[2], iso[3]]
    : brazilian
      ? [brazilian[3], brazilian[2], brazilian[1]]
      : []

  if (!year || !month || !day) {
    return null
  }

  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  const isRealDate =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)

  return isRealDate
    ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    : null
}

/**
 * Plain number with a dot or comma decimal; null for units, symbols, ranges or signs.
 * `thousandsDot` also reads `1.696` as 1696, which is only safe where a fraction can't be meant.
 */
export function parseCsvNumber(
  value: string,
  options: { thousandsDot?: boolean } = {},
): number | null {
  const text = value.trim()

  if (options.thousandsDot && /^\d{1,3}(\.\d{3})+$/.test(text)) {
    return Number(text.replaceAll(".", ""))
  }

  return /^\d+([.,]\d+)?$/.test(text) ? Number(text.replace(",", ".")) : null
}
