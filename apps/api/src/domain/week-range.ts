export type WeekRange = {
  weekStartDate: string
  weekEndDate: string
}

export function getWeekRange(date: string): WeekRange {
  const parsedDate = parseDateOnly(date)
  const dayOfWeek = parsedDate.getUTCDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const weekStart = addDays(parsedDate, -daysSinceMonday)
  const weekEnd = addDays(weekStart, 6)

  return {
    weekStartDate: formatDateOnly(weekStart),
    weekEndDate: formatDateOnly(weekEnd),
  }
}

export function getPreviousWeekRange(weekStartDate: string): WeekRange {
  const previousWeekStart = addDays(parseDateOnly(weekStartDate), -7)
  const previousWeekEnd = addDays(previousWeekStart, 6)

  return {
    weekStartDate: formatDateOnly(previousWeekStart),
    weekEndDate: formatDateOnly(previousWeekEnd),
  }
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)

  return nextDate
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}
