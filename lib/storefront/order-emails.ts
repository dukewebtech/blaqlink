import type { SupabaseClient } from "@supabase/supabase-js"

/** Raw fields needed from `order_items` (or the pre-insert equivalent) to build an email-ready item list. */
interface OrderItemLike {
  product_id: string
  product_title: string
  quantity: number
  subtotal: number
}

interface EmailReadyItem {
  product_title: string
  quantity: number
  price: number
  subtotal: number
  image: string | null
}

/** Looks up each item's product image so order emails can show a thumbnail. */
export async function attachItemImages(
  supabase: SupabaseClient,
  items: OrderItemLike[],
): Promise<EmailReadyItem[]> {
  const productIds = [...new Set(items.map((i) => i.product_id))]
  const { data: products } = await supabase.from("products").select("id, images").in("id", productIds)
  const imageById = new Map((products ?? []).map((p: any) => [p.id, (p.images && p.images[0]) || null]))

  return items.map((i) => ({
    product_title: i.product_title,
    quantity: i.quantity,
    price: i.subtotal / (i.quantity || 1),
    subtotal: i.subtotal,
    image: imageById.get(i.product_id) ?? null,
  }))
}

/** Raw vendor row fields (from `users`) needed to skin an order email with the vendor's own branding. */
interface VendorRowLike {
  business_name?: string | null
  full_name?: string | null
  store_logo_url?: string | null
  store_brand_color?: string | null
  store_slug?: string | null
  email?: string | null
  phone?: string | null
  business_address?: string | null
}

export interface VendorBranding {
  name: string
  logoUrl?: string | null
  brandColor?: string | null
  storeSlug?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

export function buildVendorBranding(vendor: VendorRowLike | null, fallbackSlug: string): VendorBranding {
  return {
    name: vendor?.business_name || vendor?.full_name || "Vendor",
    logoUrl: vendor?.store_logo_url || null,
    brandColor: vendor?.store_brand_color || null,
    storeSlug: vendor?.store_slug || fallbackSlug,
    email: vendor?.email || null,
    phone: vendor?.phone || null,
    address: vendor?.business_address || null,
  }
}

/** Splits an order's total into a display-ready subtotal + delivery fee, derived from its line items. */
export function splitOrderTotal(
  items: { subtotal: number }[],
  totalAmount: number,
  deliveryMethod: string | null,
): { subtotal: number; deliveryFee: number } {
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0)
  const deliveryFee = deliveryMethod === "delivery" ? Math.max(0, totalAmount - subtotal) : 0
  return { subtotal, deliveryFee }
}

/** A single formatted delivery address line, or null when there's nothing to show (pickup / digital-only orders). */
export function formatDeliveryAddress(order: {
  delivery_method?: string | null
  delivery_address?: string | null
  delivery_city?: string | null
  delivery_state?: string | null
}): string | null {
  if (order.delivery_method !== "delivery" || !order.delivery_address) return null
  return [order.delivery_address, order.delivery_city, order.delivery_state].filter(Boolean).join(", ")
}
