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
