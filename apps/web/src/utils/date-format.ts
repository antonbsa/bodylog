export function formatDisplayDateFromIso(value: string): string {
  const [year, month, day] = value.split("-")

  return `${day}/${month}/${year}`
}

export function getTodayIsoDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function getDateOnlyDifferenceInDays(
  startDate: string,
  endDate: string,
): number {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay)
}

export function parseDisplayDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())

  if (!match) {
    return null
  }

  const [, day, month, year] = match
  const isoDate = `${year}-${month}-${day}`
  const parsedDate = new Date(`${isoDate}T00:00:00.000Z`)

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== Number(year) ||
    parsedDate.getUTCMonth() + 1 !== Number(month) ||
    parsedDate.getUTCDate() !== Number(day)
  ) {
    return null
  }

  return isoDate
}

/** Moves an ISO date by whole days, ignoring time zones and DST. */
export function shiftIsoDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`)

  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString().slice(0, 10)
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]
const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
]

/** Short label such as "qui, 12 nov". */
export function formatDayLabel(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`)

  return `${WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}

/** "DD/MM" for dialogs and the mode badge. */
export function formatDayMonth(value: string): string {
  const [, month, day] = value.split("-")

  return `${day}/${month}`
}

/** Accepts only a real ISO date that is not in the future. */
export function isPastOrTodayIsoDate(value: string | null): value is string {
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value &&
    value <= getTodayIsoDate()
  )
}
