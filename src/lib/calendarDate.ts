/** Business-calendar helpers anchored to a named timezone (default Europe/Kyiv). */

export const DEFAULT_CALENDAR_TZ = 'Europe/Kyiv'

export type Ymd = { year: number; month: number; day: number }

/** Calendar Y-M-D in `timeZone` (month is 1–12). */
export function getZonedYmd(
  date: Date = new Date(),
  timeZone: string = DEFAULT_CALENDAR_TZ,
): Ymd {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)

  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value)

  return { year: num('year'), month: num('month'), day: num('day') }
}

/**
 * Local Date at noon for a calendar Y-M-D.
 * Noon avoids DST midnight edges when building month grids with date-fns.
 */
export function calendarDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function todayInZone(timeZone: string = DEFAULT_CALENDAR_TZ): Date {
  const { year, month, day } = getZonedYmd(new Date(), timeZone)
  return calendarDate(year, month, day)
}

export function startOfMonthInZone(
  date: Date = new Date(),
  timeZone: string = DEFAULT_CALENDAR_TZ,
): Date {
  const { year, month } = getZonedYmd(date, timeZone)
  return calendarDate(year, month, 1)
}

/** Shift by whole calendar months; keeps day-1 noon (no date-fns DST drift). */
export function addCalendarMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12, 0, 0, 0)
}

export function ymdKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function formatYmdInZone(
  date: Date,
  timeZone: string = DEFAULT_CALENDAR_TZ,
): string {
  const { year, month, day } = getZonedYmd(date, timeZone)
  return ymdKey(year, month, day)
}

export function isSameYmd(a: Date, b: Date, timeZone: string = DEFAULT_CALENDAR_TZ): boolean {
  return formatYmdInZone(a, timeZone) === formatYmdInZone(b, timeZone)
}
