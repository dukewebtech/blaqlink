import type { CartItem } from "@/lib/cart-store"

export interface DeliveryArea {
  id: string
  name: string
  note: string | null
  fee: number
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
