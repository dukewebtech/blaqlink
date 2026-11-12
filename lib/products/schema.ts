// Product rules shared by the product form (browser) and the products API
// (server), so what the form allows and what the server saves can't drift.

export type ProductType = "digital" | "event" | "physical" | "appointment"
export type ProductStatus = "draft" | "published"

export const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

/** Lowest price a buyer can pay for one item. Below this the fixed per-sale fee eats most of it. */
export const MIN_PRICE = 100
export const MAX_PRICE = 50_000_000
export const MAX_IMAGES = 8
export const MAX_TIERS = 10
export const MAX_VARIANTS = 50

export interface TierInput {
  id?: string
  name: string
  price: number
  quantity_total: number | null
}

export interface VariantInput {
  id?: string
  size: string | null
  color_name: string | null
  color_hex: string | null
  stock_quantity: number
}

export interface ProductInput {
  product_type: ProductType
  status: ProductStatus
  title: string
  description: string | null
  price: number
  compare_at_price: number | null
  category: string | null
  images: string[]
  // digital
  file_urls: string[]
  license_type: "standard" | "extended" | null
  download_limit: number | null
  // event
  event_date: string | null
  event_location: string | null
  ticket_tiers: TierInput[]
  // physical
  sku: string | null
  stock_quantity: number | null
  variants: VariantInput[]
  weight_kg: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  // appointment
  duration_minutes: number | null
  available_days: DayOfWeek[]
  start_time: string | null
  end_time: string | null
  time_slots: string[]
  booking_link: string | null
}

export type ProductErrors = Partial<Record<string, string>>

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function fromMinutes(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

/**
 * Bookable start times between start and end, one per session length.
 * A session must finish by the end time: 09:00–12:00 at 60 min → 09:00, 10:00, 11:00.
 */
export function generateTimeSlots(start: string | null, end: string | null, durationMinutes: number | null): string[] {
  if (!start || !end || !durationMinutes || !TIME_RE.test(start) || !TIME_RE.test(end) || durationMinutes <= 0) return []
  const slots: string[] = []
  for (let t = toMinutes(start); t + durationMinutes <= toMinutes(end); t += durationMinutes) {
    slots.push(fromMinutes(t))
  }
  return slots
}

function isWholeNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n)
}

function isPrice(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && Math.round(n * 100) === n * 100
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

function priceError(value: unknown, label = "Price"): string | null {
  if (!isPrice(value)) return `Enter a ${label.toLowerCase()} in naira, like 5000.`
  if (value < MIN_PRICE) return `${label} must be at least ₦${MIN_PRICE}.`
  if (value > MAX_PRICE) return `${label} is too high.`
  return null
}

/**
 * Checks a product before it's saved. Drafts only need a title and type, so a
 * vendor can save half-finished work; publishing needs everything a buyer
 * needs. Returns field → message for each problem.
 */
export function validateProduct(input: ProductInput): ProductErrors {
  const e: ProductErrors = {}
  const publishing = input.status === "published"

  if (!["digital", "event", "physical", "appointment"].includes(input.product_type)) e.product_type = "Choose a product type."
  if (input.status !== "draft" && input.status !== "published") e.status = "Choose publish or draft."
  if (!input.title?.trim()) e.title = "Give it a name buyers will recognise."
  else if (input.title.trim().length > 200) e.title = "Keep the name under 200 characters."
  if (input.description && input.description.length > 5000) e.description = "Keep the description under 5,000 characters."
  if (input.category && !UUID_RE.test(input.category)) e.category = "Choose a category from the list."
  if (input.images.length > MAX_IMAGES) e.images = `Add up to ${MAX_IMAGES} photos.`
  if (input.images.some((url) => !isHttpUrl(url))) e.images = "One of the photos didn't upload properly. Remove it and try again."

  if (input.product_type !== "event") {
    const err = priceError(input.price)
    if (err && (publishing || input.price !== 0)) e.price = err
    if (input.compare_at_price !== null) {
      if (!isPrice(input.compare_at_price) || input.compare_at_price <= input.price) {
        e.compare_at_price = "The original price must be higher than the selling price."
      }
    }
  }

  switch (input.product_type) {
    case "digital":
      if (publishing && input.file_urls.length === 0) e.file_urls = "Upload the file buyers will download."
      if (input.license_type && !["standard", "extended"].includes(input.license_type)) e.license_type = "Choose a licence."
      if (input.download_limit !== null && (!isWholeNumber(input.download_limit) || input.download_limit < 1 || input.download_limit > 100)) {
        e.download_limit = "Use a whole number from 1 to 100, or leave it empty for unlimited."
      }
      break

    case "event": {
      if (publishing) {
        if (!input.event_date) e.event_date = "Add the date and time of the event."
        else if (Number.isNaN(Date.parse(input.event_date))) e.event_date = "Enter a valid date and time."
        else if (Date.parse(input.event_date) < Date.now()) e.event_date = "The event date has already passed."
        if (!input.event_location?.trim()) e.event_location = "Add where the event takes place."
      }
      if (input.ticket_tiers.length === 0) e.ticket_tiers = "Add at least one ticket type."
      if (input.ticket_tiers.length > MAX_TIERS) e.ticket_tiers = `Add up to ${MAX_TIERS} ticket types.`
      const names = new Set<string>()
      input.ticket_tiers.forEach((tier, i) => {
        if (!tier.name?.trim()) e[`ticket_tiers.${i}.name`] = "Name this ticket type, like Regular or VIP."
        else if (names.has(tier.name.trim().toLowerCase())) e[`ticket_tiers.${i}.name`] = "Each ticket type needs a different name."
        names.add(tier.name?.trim().toLowerCase())
        const err = priceError(tier.price)
        if (err) e[`ticket_tiers.${i}.price`] = err
        if (tier.quantity_total !== null && (!isWholeNumber(tier.quantity_total) || tier.quantity_total < 1)) {
          e[`ticket_tiers.${i}.quantity_total`] = "Use a whole number, or leave it empty for no limit."
        }
      })
      break
    }

    case "physical":
      if (input.stock_quantity !== null && (!isWholeNumber(input.stock_quantity) || input.stock_quantity < 0)) {
        e.stock_quantity = "Use a whole number of 0 or more."
      }
      if (input.variants.length > MAX_VARIANTS) e.variants = `Add up to ${MAX_VARIANTS} options.`
      {
        const seen = new Set<string>()
        input.variants.forEach((v, i) => {
          if (!v.size?.trim() && !v.color_name?.trim()) e[`variants.${i}.size`] = "Give this option a size or a colour."
          const key = `${v.size?.trim().toLowerCase() ?? ""}|${v.color_name?.trim().toLowerCase() ?? ""}`
          if (seen.has(key)) e[`variants.${i}.size`] = "This option is listed twice."
          seen.add(key)
          if (!isWholeNumber(v.stock_quantity) || v.stock_quantity < 0) e[`variants.${i}.stock_quantity`] = "Use a whole number of 0 or more."
          if (v.color_hex && !/^#[0-9a-f]{6}$/i.test(v.color_hex)) e[`variants.${i}.color_hex`] = "Pick a colour from the picker."
        })
      }
      for (const field of ["weight_kg", "length_cm", "width_cm", "height_cm"] as const) {
        const value = input[field]
        if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value <= 0)) e[field] = "Use a number above 0."
      }
      break

    case "appointment": {
      if (input.duration_minutes === null || !isWholeNumber(input.duration_minutes) || input.duration_minutes < 15 || input.duration_minutes > 480) {
        if (publishing || input.duration_minutes !== null) e.duration_minutes = "Choose how long each session lasts."
      }
      if (input.available_days.some((d) => !DAYS_OF_WEEK.includes(d))) e.available_days = "Choose days from the list."
      if (publishing && input.available_days.length === 0) e.available_days = "Choose at least one day you're available."
      const timesSet = !!input.start_time || !!input.end_time
      if (publishing || timesSet) {
        if (!input.start_time || !TIME_RE.test(input.start_time)) e.start_time = "Add the time your first session can start."
        if (!input.end_time || !TIME_RE.test(input.end_time)) e.end_time = "Add the time your last session must end."
        if (!e.start_time && !e.end_time && toMinutes(input.end_time!) <= toMinutes(input.start_time!)) {
          e.end_time = "The end time must be after the start time."
        }
      }
      if (!e.start_time && !e.end_time && !e.duration_minutes && (publishing || timesSet)) {
        const expected = generateTimeSlots(input.start_time, input.end_time, input.duration_minutes)
        if (expected.length === 0) e.end_time = "Leave enough time for at least one full session."
        else if (input.time_slots.join() !== expected.join()) e.time_slots = "The session times are out of date. Check the times and save again."
      }
      if (input.booking_link && !isHttpUrl(input.booking_link)) e.booking_link = "Enter a full link starting with https://"
      break
    }
  }

  return e
}

/** Turns loosely-typed JSON (from a form or API call) into a ProductInput. Never throws. */
export function normaliseProductInput(raw: Record<string, unknown>): ProductInput {
  const str = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null)
  const num = (v: unknown) => {
    if (typeof v === "number") return v
    if (typeof v === "string" && v.trim() !== "") return Number(v)
    return null
  }
  const arr = <T,>(v: unknown, map: (x: any) => T): T[] => (Array.isArray(v) ? v.map(map) : [])
  const type = raw.product_type as ProductType

  const tiers = arr(raw.ticket_tiers, (t) => ({
    id: str(t?.id) ?? undefined,
    name: typeof t?.name === "string" ? t.name.trim() : "",
    price: num(t?.price) ?? NaN,
    quantity_total: num(t?.quantity_total),
  }))

  const priceRaw = num(raw.price)
  return {
    product_type: type,
    status: raw.status === "published" ? "published" : "draft",
    title: typeof raw.title === "string" ? raw.title.trim() : "",
    description: str(raw.description),
    // An event's listed price is its cheapest ticket.
    price: type === "event" ? (tiers.length ? Math.min(...tiers.map((t) => (Number.isFinite(t.price) ? t.price : Infinity))) : 0) : (priceRaw ?? 0),
    compare_at_price: type === "event" ? null : num(raw.compare_at_price),
    category: str(raw.category),
    images: arr(raw.images, String).filter(Boolean),
    file_urls: type === "digital" ? arr(raw.file_urls, String).filter(Boolean) : [],
    license_type: type === "digital" ? ((str(raw.license_type) as ProductInput["license_type"]) ?? "standard") : null,
    download_limit: type === "digital" ? num(raw.download_limit) : null,
    event_date: type === "event" ? str(raw.event_date) : null,
    event_location: type === "event" ? str(raw.event_location) : null,
    ticket_tiers: type === "event" ? tiers : [],
    sku: type === "physical" ? str(raw.sku) : null,
    stock_quantity: type === "physical" ? num(raw.stock_quantity) : null,
    variants:
      type === "physical"
        ? arr(raw.variants, (v) => ({
            id: str(v?.id) ?? undefined,
            size: str(v?.size),
            color_name: str(v?.color_name),
            color_hex: str(v?.color_hex),
            stock_quantity: num(v?.stock_quantity) ?? NaN,
          }))
        : [],
    weight_kg: type === "physical" ? num(raw.weight_kg) : null,
    length_cm: type === "physical" ? num(raw.length_cm) : null,
    width_cm: type === "physical" ? num(raw.width_cm) : null,
    height_cm: type === "physical" ? num(raw.height_cm) : null,
    duration_minutes: type === "appointment" ? num(raw.duration_minutes) : null,
    available_days: type === "appointment" ? (arr(raw.available_days, String) as DayOfWeek[]) : [],
    start_time: type === "appointment" ? str(raw.start_time)?.slice(0, 5) ?? null : null,
    end_time: type === "appointment" ? str(raw.end_time)?.slice(0, 5) ?? null : null,
    time_slots: type === "appointment" ? arr(raw.time_slots, String) : [],
    booking_link: type === "appointment" ? str(raw.booking_link) : null,
  }
}
