import { addDays, lagosDate, lagosWeekday, slotStart } from "@/lib/dates"

// Shape checks for a cart line from the browser. Prices, stock and
// ownership are checked separately against the database; this only makes
// sure the line itself is something a real cart could send.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const MAX_LINES = 50
export const MAX_QUANTITY = 100
export const BOOKING_WINDOW_DAYS = 60

export interface CheckoutLine {
  product_id: string
  quantity: number
  product_variant_id?: string
  ticket_tier_id?: string
  appointment_date?: string
  appointment_time?: string
}

export function parseCheckoutLines(raw: unknown): { ok: true; lines: CheckoutLine[] } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, error: "Your bag is empty." }
  if (raw.length > MAX_LINES) return { ok: false, error: `You can check out up to ${MAX_LINES} items at once.` }

  const lines: CheckoutLine[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") return { ok: false, error: "Your bag has an invalid item. Remove it and try again." }
    const { product_id, quantity, product_variant_id, ticket_tier_id, appointment_date, appointment_time } = item as Record<string, unknown>
    if (typeof product_id !== "string" || !UUID_RE.test(product_id)) return { ok: false, error: "Your bag has an invalid item. Remove it and try again." }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return { ok: false, error: `Quantities must be whole numbers from 1 to ${MAX_QUANTITY}.` }
    }
    for (const id of [product_variant_id, ticket_tier_id]) {
      if (id !== undefined && (typeof id !== "string" || !UUID_RE.test(id))) return { ok: false, error: "Your bag has an invalid option. Remove it and try again." }
    }
    if (appointment_date !== undefined && (typeof appointment_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date))) {
      return { ok: false, error: "Pick a date for your booking again." }
    }
    if (appointment_time !== undefined && (typeof appointment_time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(appointment_time))) {
      return { ok: false, error: "Pick a time for your booking again." }
    }
    lines.push({
      product_id,
      quantity,
      ...(product_variant_id ? { product_variant_id: product_variant_id as string } : {}),
      ...(ticket_tier_id ? { ticket_tier_id: ticket_tier_id as string } : {}),
      ...(appointment_date ? { appointment_date: appointment_date as string } : {}),
      ...(appointment_time ? { appointment_time: appointment_time as string } : {}),
    })
  }
  return { ok: true, lines }
}

/** Is this a slot the vendor offers, on a day they work, in the bookable future? */
export function bookingSlotError(
  product: { available_days: string[] | null; time_slots: string[] | null },
  date: string,
  time: string,
  now: Date = new Date(),
): string | null {
  if (!(product.time_slots ?? []).includes(time)) return "That time isn't offered. Pick another time."
  if (!(product.available_days ?? []).includes(lagosWeekday(date))) return "That day isn't available. Pick another day."
  if (slotStart(date, time).getTime() <= now.getTime()) return "That time has passed. Pick a later time."
  if (date > addDays(lagosDate(now), BOOKING_WINDOW_DAYS)) return "That date is too far ahead. Pick an earlier date."
  return null
}
