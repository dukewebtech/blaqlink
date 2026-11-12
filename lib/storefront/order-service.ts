import { initializeTransaction } from "@/lib/paystack"
import { randomUUID } from "crypto"
import { createAdminClient } from "@/lib/supabase/server"
import type { CheckoutLine } from "@/lib/storefront/checkout-lines"

/**
 * The server-priced checkout saved in payment_sessions before the buyer goes
 * to Paystack. The order is created from this (never from Paystack's
 * metadata) once payment is confirmed — see lib/storefront/confirm-paystack-payment.ts.
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
  // Set only when the vendor uses a live-rate shipping mode (Terminal Africa / Shipbubble)
  // and the shopper picked a courier — null for every manual-mode order (the default).
  shipping_provider: "terminal_africa" | "shipbubble" | null
  shipping_rate_id: string | null
  shipping_request_token: string | null
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

export type CreateCheckoutSessionResult =
  | { ok: true; authorization_url: string; reference: string }
  | { ok: false; status: number; error: string }

const HOLD_MINUTES = 30

/**
 * Hands a server-priced checkout to Paystack:
 *  1. holds the stock, tickets and booking slots (reserve_checkout), so two
 *     buyers can't both pay for the last one;
 *  2. saves the order data and expected amount in payment_sessions — the
 *     only thing /api/payment/verify trusts, since Paystack metadata can be
 *     forged;
 *  3. opens the Paystack transaction under our own reference.
 * Holds are released if any step fails, and expire after 30 minutes.
 */
export async function createCheckoutSession(params: {
  vendorId: string
  metadata: PendingOrderMetadata
  email: string
  amount: number
  callbackUrl: string
  lines: CheckoutLine[]
}): Promise<CreateCheckoutSessionResult> {
  const supabase = createAdminClient()
  const reference = `BQ-${randomUUID()}`

  const { data: reserved, error: reserveError } = await supabase.rpc("reserve_checkout", {
    p_reference: reference,
    p_lines: params.lines,
    p_ttl_minutes: HOLD_MINUTES,
  })
  if (reserveError) {
    console.error("[checkout] reserve failed:", reserveError.message)
    return { ok: false, status: 500, error: "We couldn't start checkout. Please try again." }
  }
  if (!reserved?.ok) {
    return { ok: false, status: 409, error: reserved?.message ?? "Something in your bag is no longer available." }
  }

  const release = () => supabase.from("inventory_holds").update({ status: "released" }).eq("reference", reference).eq("status", "held")

  const { error: sessionError } = await supabase.from("payment_sessions").insert({
    reference,
    gateway: "paystack",
    order_data: { ...params.metadata, vendor_id: params.vendorId, expected_amount: params.amount },
  })
  if (sessionError) {
    console.error("[checkout] session save failed:", sessionError.message)
    await release()
    return { ok: false, status: 500, error: "We couldn't start checkout. Please try again." }
  }

  let data: any
  try {
    data = await initializeTransaction({
      email: params.email,
      amount: params.amount,
      // Paystack shows this on its page; the order itself is never read from it.
      metadata: { store: params.metadata.items[0]?.product_title ?? "Blaqora order" },
      callbackUrl: params.callbackUrl,
      reference,
    })
  } catch (error) {
    console.error("[checkout] Paystack unreachable:", error instanceof Error ? error.message : error)
    data = null
  }

  if (!data?.status || !data.data?.authorization_url) {
    await release()
    await supabase.from("payment_sessions").delete().eq("reference", reference)
    console.error("[checkout] Paystack refused:", data?.message)
    return { ok: false, status: 502, error: "Payment couldn't be started. Please try again in a moment." }
  }

  return { ok: true, authorization_url: data.data.authorization_url, reference }
}
