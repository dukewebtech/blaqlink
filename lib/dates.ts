// Every Blaqora store sells in Lagos time (WAT, UTC+1, no daylight saving).
// Servers and buyers' devices may be on other clocks, so dates that mean
// "a day in Lagos" are always worked out here rather than with new Date().

export const LAGOS_TZ = "Africa/Lagos"
const LAGOS_OFFSET = "+01:00"

const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: LAGOS_TZ, year: "numeric", month: "2-digit", day: "2-digit" })
const hm = new Intl.DateTimeFormat("en-GB", { timeZone: LAGOS_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
const dow = new Intl.DateTimeFormat("en-US", { timeZone: LAGOS_TZ, weekday: "short" })

/** "YYYY-MM-DD" for the Lagos calendar day containing `date`. */
export function lagosDate(date: Date = new Date()): string {
  return ymd.format(date)
}

/** "HH:MM" Lagos clock time of `date`. */
export function lagosTime(date: Date = new Date()): string {
  return hm.format(date)
}

/** "Mon".."Sun" for a Lagos calendar day. */
export function lagosWeekday(isoDate: string): string {
  return dow.format(new Date(`${isoDate}T12:00:00${LAGOS_OFFSET}`))
}

/** Adds whole days to a "YYYY-MM-DD" date. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00${LAGOS_OFFSET}`)
  d.setUTCDate(d.getUTCDate() + days)
  return lagosDate(d)
}

/** Value for <input type="datetime-local"> showing an instant in Lagos time. */
export function toLagosInput(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return `${lagosDate(d)}T${lagosTime(d)}`
}

/** A datetime-local value typed by the vendor, read as Lagos time, as ISO. */
export function fromLagosInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  return `${value}:00${LAGOS_OFFSET}`
}

/** The instant a booking slot starts. */
export function slotStart(isoDate: string, time: string): Date {
  return new Date(`${isoDate}T${time}:00${LAGOS_OFFSET}`)
}

const eventFormat = new Intl.DateTimeFormat("en-NG", {
  timeZone: LAGOS_TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

/** "Fri, 24 Oct 2026, 7:00 pm" in Lagos time. */
export function formatEventDate(iso: string): string {
  return eventFormat.format(new Date(iso))
}
