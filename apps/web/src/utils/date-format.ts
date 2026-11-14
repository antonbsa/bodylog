export function formatDisplayDateFromIso(value: string): string {
  const [year, month, day] = value.split("-")

  return `${day}/${month}/${year}`
}

/** ISO date of a `Date`'s local calendar day (never `toISOString()`, which shifts by time zone). */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/** Local-midnight `Date` of an ISO date, for calendar widgets. */
export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)

  return new Date(year, month - 1, day)
}

/** First and last ISO date of the month containing `date` (local calendar). */
export function getMonthRange(date: Date): { from: string; to: string } {
  const year = date.getFullYear()
  const month = date.getMonth()

  return {
    from: toIsoDate(new Date(year, month, 1)),
    to: toIsoDate(new Date(year, month + 1, 0)),
  }
}

export function getTodayIsoDate(): string {
  return toIsoDate(new Date())
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

/** Week range such as "9–15 nov", or "30 nov – 6 dez" across months. */
export function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  const startMonth = MONTHS[start.getUTCMonth()]
  const endMonth = MONTHS[end.getUTCMonth()]

  return startMonth === endMonth
    ? `${start.getUTCDate()}–${end.getUTCDate()} ${endMonth}`
    : `${start.getUTCDate()} ${startMonth} – ${end.getUTCDate()} ${endMonth}`
}

/** "DD/MM" for dialogs and the mode badge. */
export function formatDayMonth(value: string): string {
  const [, month, day] = value.split("-")

  return `${day}/${month}`
}

/** List row label such as "seg 09/11". */
export function formatRowDate(value: string): string {
  const weekday = WEEKDAYS[new Date(`${value}T00:00:00.000Z`).getUTCDay()]

  return `${weekday} ${formatDayMonth(value)}`
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
