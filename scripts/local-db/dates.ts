export function parseOptionalToday(args: string[]): Date {
  if (args.length === 0) {
    return startOfLocalDay(new Date())
  }

  if (args.length !== 2 || args[0] !== "--today") {
    throw new Error("Only `--today YYYY-MM-DD` is supported.")
  }

  return parseIsoDate(args[1])
}

export function parseIsoDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid date "${value}". Expected YYYY-MM-DD.`)
  }

  const [year, month, day] = value.split("-").map(Number)
  return startOfLocalDay(new Date(year, month - 1, day))
}

export function startOfMondayWeek(date: Date): Date {
  const day = date.getDay()
  const daysSinceMonday = day === 0 ? 6 : day - 1
  return addDays(startOfLocalDay(date), -daysSinceMonday)
}

export function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

export function differenceInDays(laterDate: Date, earlierDate: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return Math.round(
    (startOfLocalDay(laterDate).getTime() -
      startOfLocalDay(earlierDate).getTime()) /
      millisecondsPerDay,
  )
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
