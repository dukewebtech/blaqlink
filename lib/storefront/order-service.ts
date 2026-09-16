import type { CartItem } from "@/lib/cart-store"
import { initializeTransaction } from "@/lib/paystack"
import type { CheckoutState, CheckoutTotals } from "@/lib/storefront/checkout"

/**
 * The exact shape stashed as Paystack `metadata` at initialize time and read
 * back at verify time — this is how order data survives the redirect to
 * Paystack's hosted page and back, since the order row itself is only created
 * once payment succeeds (see app/api/payment/verify/route.ts).
 */
export interface PendingOrderMetadata {
  customer_name: string
  customer_phone: string
  delivery_method: "delivery" | "pickup" | null
  delivery_area: string | null
  delivery_address: string | null
  delivery_state: string | null
  delivery_city: string | null
  delivery_postal_code: string | null
  customer_note: string | null
  items: PendingOrderItem[]
}

export interface PendingOrderItem {
  product_id: string
  product_title: string
  product_type: string
  quantity: number
  price: number
  subtotal: number
  product_variant_id?: string
  variant_label?: string
  ticket_tier_id?: string
  ticket_tier_name?: string
  appointment_date?: string
  appointment_time?: string
}

export function buildOrderMetadata(items: CartItem[], state: CheckoutState, totals: CheckoutTotals): PendingOrderMetadata {
  return {
    customer_name: state.name,
    customer_phone: state.phone,
    delivery_method: totals.needsDelivery ? state.method : null,
    delivery_area: totals.needsDelivery && state.method === "delivery" ? state.areaName : null,
    delivery_address: totals.needsDelivery && state.method === "delivery" ? state.address : null,
    delivery_state: totals.needsDelivery && state.method === "delivery" ? state.addressState : null,
    delivery_city: totals.needsDelivery && state.method === "delivery" ? state.addressCity : null,
    delivery_postal_code: totals.needsDelivery && state.method === "delivery" ? state.addressPostalCode || null : null,
    customer_note: state.note || null,
    items: items.map((item) => ({
      product_id: item.product_id,
      product_title: item.title,
      product_type: item.product_type,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
      ...(item.product_variant_id && { product_variant_id: item.product_variant_id }),
      ...(item.variant_label && { variant_label: item.variant_label }),
      ...(item.ticket_tier_id && { ticket_tier_id: item.ticket_tier_id }),
      ...(item.ticket_tier_name && { ticket_tier_name: item.ticket_tier_name }),
      ...(item.appointment_date && { appointment_date: item.appointment_date }),
      ...(item.appointment_time && { appointment_time: item.appointment_time }),
    })),
  }
}

export interface CreateCheckoutSessionResult {
  authorization_url: string
  access_code: string
  reference: string
}

/**
 * "Hand off to Paystack" — the order itself is created later, once payment is
 * verified (see app/api/payment/verify/route.ts). Takes already server-resolved
 * metadata (real prices/stock re-checked by the caller) and opens a hosted
 * Paystack transaction for the customer to pay on.
 */
export async function createCheckoutSession(params: {
  metadata: PendingOrderMetadata
  email: string
  amount: number
  callbackUrl: string
}): Promise<CreateCheckoutSessionResult> {
  const data = await initializeTransaction({
    email: params.email,
    amount: params.amount,
    metadata: params.metadata,
    callbackUrl: params.callbackUrl,
  })

  if (!data.status) {
    throw new Error(data.message || "Payment initialization failed")
  }

  return {
    authorization_url: data.data.authorization_url,
    access_code: data.data.access_code,
    reference: data.data.reference,
  }
}
