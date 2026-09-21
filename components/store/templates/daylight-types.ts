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
  // Vendor-defined sub-category (the `categories` table), scoped to this item's type.
  // Only Ora currently filters by this — null when unset or when a template ignores it.
  categoryId: string | null
  categoryName: string | null
  categoryImageUrl: string | null
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
  // When set, checkout auto-fills (and locks) the shipping-address state —
  // and city too, if the zone also has one — instead of asking twice.
  state: string | null
  city: string | null
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
  // "manual" (the default) uses deliveryAreas above. Any other mode means the
  // vendor connected a live courier — checkout fetches real rates instead.
  shippingMode: "manual" | "terminal_africa" | "shipbubble"
  // Storefront-only font pairing (see lib/storefront/fonts.ts). "modern" is
  // today's fixed pairing — every existing store is unaffected until changed.
  fontPairing: "modern" | "classic" | "minimal" | "elegant"
}

export interface LiveDeliveryRate {
  id: string
  carrierName: string
  carrierLogo: string | null
  amount: number
  etaLabel: string | null
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
