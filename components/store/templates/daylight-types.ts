export type DaylightItemType = "physical" | "event" | "appointment" | "digital"

export interface DaylightVariant {
  id: string
  size: string | null
  colorName: string | null
  colorHex: string | null
  stock: number
}

export interface DaylightTier {
  id: string
  name: string
  price: number
  left: number | null // null = unlimited
}

export interface DaylightBookingDay {
  label: string // e.g. "Fri 24 Oct"
  dow: string // e.g. "Fri"
  dateNum: number
  date: string // ISO yyyy-mm-dd
  free: boolean
  slots: { time: string; free: boolean }[]
}

export interface DaylightItem {
  id: string
  type: DaylightItemType
  name: string
  description: string
  price: number
  compareAtPrice: number | null
  images: string[]
  // physical
  stock: number | null
  variants: DaylightVariant[]
  // event
  eventDate: string | null
  eventLocation: string | null
  tiers: DaylightTier[]
  // appointment
  durationLabel: string | null
  venue: string | null
  days: DaylightBookingDay[]
  // digital
  fileLabel: string | null
}

export interface DaylightDeliveryArea {
  id: string
  name: string
  note: string | null
  fee: number
}

export interface DaylightStore {
  id: string
  slug: string
  name: string
  bio: string | null
  avatarUrl: string | null
  coverUrl: string | null
  accent: string
  location: string | null
  whatsappNumber: string | null // digits only, with country code, no "+"
  email: string | null
  ordersDelivered: number
  memberSinceYear: number
  verified: boolean
  deliveryAreas: DaylightDeliveryArea[]
}

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 })
export function formatNaira(n: number): string {
  return `₦${nf.format(n)}`
}

export const DAYLIGHT_TYPE_META: Record<DaylightItemType, { label: string; cls: string; icon: string }> = {
  physical: { label: "Shop", cls: "prod", icon: "dl-i-box" },
  event: { label: "Event", cls: "tix", icon: "dl-i-ticket" },
  appointment: { label: "Booking", cls: "book", icon: "dl-i-cal" },
  digital: { label: "Download", cls: "dig", icon: "dl-i-dl" },
}
