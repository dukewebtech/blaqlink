import { formatNaira as formatNairaForCards } from "@/lib/money"

export type DaylightItemType = "physical" | "event" | "appointment" | "digital"

export interface DaylightVariant {
  id: string
  size: string | null
  colorName: string | null
  colorHex: string | null
  stock: number
  /** null = same as the item's price */
  price: number | null
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
  /** Vendor's names for the two choices (variant.size / variant.colorName). */
  option1Name: string
  option2Name: string
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

export { formatNaira } from "@/lib/money"

export const DAYLIGHT_TYPE_META: Record<DaylightItemType, { label: string; cls: string; icon: string }> = {
  physical: { label: "Shop", cls: "prod", icon: "dl-i-box" },
  event: { label: "Event", cls: "tix", icon: "dl-i-ticket" },
  appointment: { label: "Booking", cls: "book", icon: "dl-i-cal" },
  digital: { label: "Download", cls: "dig", icon: "dl-i-dl" },
}

/** The variant matching the buyer's choices, falling back to a partial match. */
export function findSelectedVariant(item: DaylightItem, size: string | null, colorName: string | null): DaylightVariant | undefined {
  const hasSizes = item.variants.some((v) => v.size)
  const hasColours = item.variants.some((v) => v.colorName)
  return (
    item.variants.find((v) => (!hasSizes || v.size === size) && (!hasColours || v.colorName === colorName)) ??
    item.variants.find((v) => v.size === size) ??
    item.variants.find((v) => v.colorName === colorName)
  )
}

/**
 * Price for one of the item, given what the buyer picked: the ticket type's
 * price, else the exact option's own price, else the item's price.
 * (Checkout re-prices everything on the server.)
 */
export function selectedUnitPrice(
  item: DaylightItem,
  sel: { size: string | null; colorName: string | null },
  tier: DaylightTier | null,
): number {
  if (item.type === "event" && tier) return tier.price
  const hasSizes = item.variants.some((v) => v.size)
  const hasColours = item.variants.some((v) => v.colorName)
  const exact = item.variants.find((v) => (!hasSizes || v.size === sel.size) && (!hasColours || v.colorName === sel.colorName))
  return exact?.price ?? item.price
}

/** Lowest price a buyer could pay, for "From ₦…" on cards. null when every option costs the same. */
export function lowestOptionPrice(item: DaylightItem): number | null {
  const prices = item.variants.map((v) => v.price ?? item.price)
  if (prices.length === 0 || prices.every((p) => p === item.price)) return null
  return Math.min(...prices)
}

/** Card price: "From ₦18,500" when options cost different amounts. */
export function cardPriceText(item: DaylightItem): string {
  const low = lowestOptionPrice(item)
  return low !== null ? `From ${formatNairaForCards(low)}` : formatNairaForCards(item.price)
}
