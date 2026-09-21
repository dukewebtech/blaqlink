import type { CartItem } from "@/lib/cart-store"
import { getStatesList, getCitiesByState, type NigerianState } from "@/lib/nigerian-locations"

export interface DeliveryArea {
  id: string
  name: string
  note: string | null
  fee: number
  // When set, checkout auto-fills (and locks) the shipping-address state —
  // and city too, if the zone also has one — instead of asking the shopper
  // to pick the same location twice. Null on zones created before this
  // existed, or ones a vendor deliberately left location-agnostic (e.g. a
  // catch-all "Other states" zone) — those keep today's fully manual entry.
  state: string | null
  city: string | null
}

export interface PickupOption {
  available: true
  location: string
}

/**
 * Only physical products trigger a delivery/pickup step at all — tickets,
 * bookings and digital items are handed over by email/QR/slot, never shipped.
 * Copied exactly from the templates' `needsDelivery = cart.some(l => l.type === 'product')`.
 *
 * Pure — safe to import from client components. DB reads (getDeliveryAreas)
 * live in delivery-server.ts so this file never pulls in next/headers.
 */
export function needsDelivery(items: Pick<CartItem, "product_type">[]): boolean {
  return items.some((item) => item.product_type === "physical")
}

/** Pickup is always free — the templates hardcode "Free"; the location comes from the vendor's own address. */
export function getPickupOption(vendor: {
  business_address?: string | null
  location?: string | null
  store_city?: string | null
  store_state?: string | null
}): PickupOption {
  const location =
    vendor.business_address ||
    vendor.location ||
    [vendor.store_city, vendor.store_state].filter(Boolean).join(", ") ||
    "the seller's pickup point"
  return { available: true, location }
}

/**
 * Resolves the delivery fee for the chosen method exactly as the templates do:
 * pickup is always free, delivery is whatever area fee was chosen (0 until one is).
 */
export function resolveDeliveryFee(method: "delivery" | "pickup", chosenAreaFee: number | null): number {
  if (method === "pickup") return 0
  return chosenAreaFee ?? 0
}

/**
 * Validates a delivery zone's optional state/city against the same list the
 * checkout state/city selects use, so a stored value is guaranteed to match
 * a real dropdown option (and checkout's auto-fill never silently no-ops).
 * State, when provided at all, must be non-empty. City is only checked when
 * given, and must belong to that state's city list.
 */
export function validateAreaLocation(
  state: string | null | undefined,
  city: string | null | undefined,
  options: { requireState?: boolean } = {},
): { ok: true; state: string | null; city: string | null } | { ok: false; error: string } {
  const trimmedState = state?.trim() || null
  const trimmedCity = city?.trim() || null

  if (!trimmedState) {
    if (trimmedCity) {
      return { ok: false, error: "A city can only be set alongside a state" }
    }
    if (options.requireState) {
      return { ok: false, error: "State is required" }
    }
    return { ok: true, state: null, city: null }
  }

  if (!getStatesList().includes(trimmedState as NigerianState)) {
    return { ok: false, error: `"${trimmedState}" is not a recognised state` }
  }

  if (trimmedCity && !getCitiesByState(trimmedState as NigerianState).includes(trimmedCity)) {
    return { ok: false, error: `"${trimmedCity}" is not a recognised city in ${trimmedState}` }
  }

  return { ok: true, state: trimmedState, city: trimmedCity }
}
