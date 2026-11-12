import { createAdminClient } from "@/lib/supabase/server"
import { verifyTransaction } from "@/lib/paystack"
import { sendEmail, getNewOrderEmailForVendor, getOrderConfirmationEmailForCustomer } from "@/lib/email"
import { getVendorPlan, computeOrderFee } from "@/lib/pricing"
import { runOrderFulfilment, runShipmentBooking } from "@/lib/storefront/fulfilment"
import { attachItemImages, buildVendorBranding, splitOrderTotal, formatDeliveryAddress } from "@/lib/storefront/order-emails"
import type { PendingOrderItem, PendingOrderMetadata } from "@/lib/storefront/order-service"

type Admin = ReturnType<typeof createAdminClient>

/**
 * What the buyer's confirmation page is shown — the same shape whether the
 * order was just created, already existed, or is being reloaded. Holds no
 * phone number, address or full email: anyone with the reference can ask.
 */
export interface PublicOrderSummary {
  reference: string
  firstName: string
  emailHint: string
  totalAmount: number
  items: {
    title: string
    type: string
    quantity: number
    variantLabel: string | null
    tierName: string | null
    appointmentDate: string | null
    appointmentTime: string | null
  }[]
  store: { name: string; slug: string | null; whatsapp: string | null }
}

export type ConfirmPaymentResult =
  | { state: "confirmed"; created: boolean; summary: PublicOrderSummary }
  | { state: "pending" }
  | { state: "failed"; status: number; error: string }

const PENDING_STATUSES = new Set(["ongoing", "pending", "processing", "queued"])

function maskEmail(email: string) {
  const [user, domain] = email.split("@")
  if (!domain) return "your email"
  return `${user.slice(0, 2)}${"•".repeat(Math.max(user.length - 2, 1))}@${domain}`
}

/**
 * Turns a successful Paystack payment into an order. Called by the buyer's
 * return page (/api/payment/verify) and by Paystack's webhook; safe to call
 * any number of times, concurrently:
 *  - the charge is re-checked with Paystack and against the server-saved
 *    checkout (never Paystack metadata), including the amount;
 *  - the order, its items and the stock changes are written in one
 *    transaction, once per reference (create_paid_order);
 *  - emails and fulfilment resume from wherever a previous call stopped.
 */
export async function confirmPaystackPayment(reference: string): Promise<ConfirmPaymentResult> {
  const supabase = createAdminClient()

  const { data: existing } = await supabase.from("orders").select("id").eq("payment_reference", reference).maybeSingle()
  if (existing) {
    await finishOrder(supabase, existing.id)
    const summary = await getPublicOrderSummary(existing.id)
    return summary ? { state: "confirmed", created: false, summary } : { state: "failed", status: 500, error: "Order not found" }
  }

  const { data: session } = await supabase
    .from("payment_sessions")
    .select("order_data")
    .eq("reference", reference)
    .eq("gateway", "paystack")
    .maybeSingle()
  if (!session?.order_data) {
    return { state: "failed", status: 404, error: "We couldn't find this checkout." }
  }

  const verification = await verifyTransaction(reference).catch(() => null)
  const charge = verification?.data
  if (!verification?.status || !charge) {
    return { state: "failed", status: 502, error: "We couldn't reach the payment provider. Refresh in a moment." }
  }
  if (PENDING_STATUSES.has(charge.status)) return { state: "pending" }
  if (charge.status !== "success") {
    return { state: "failed", status: 402, error: "This payment didn't go through. You haven't been charged." }
  }

  const orderData = session.order_data as PendingOrderMetadata & { vendor_id: string; expected_amount: number }
  const expected = Math.round(Number(orderData.expected_amount) * 100)
  if (charge.currency !== "NGN" || !Number.isFinite(expected) || Math.round(Number(charge.amount)) < expected) {
    console.error("[paystack] Paid amount does not match checkout:", { reference, paid: charge.amount, expected })
    return { state: "failed", status: 409, error: "The amount paid doesn't match this order. Contact the seller with your reference." }
  }

  const totalAmount = expected / 100
  const fee = computeOrderFee(totalAmount, await getVendorPlan(orderData.vendor_id))

  const { data: result, error } = await supabase.rpc("create_paid_order", {
    p_order: {
      user_id: orderData.vendor_id,
      customer_email: String(charge.customer?.email ?? "").toLowerCase(),
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_note: orderData.customer_note,
      delivery_method: orderData.delivery_method,
      delivery_area: orderData.delivery_area,
      delivery_address: orderData.delivery_address,
      delivery_state: orderData.delivery_state,
      delivery_city: orderData.delivery_city,
      delivery_postal_code: orderData.delivery_postal_code,
      total_amount: totalAmount,
      payment_reference: reference,
      shipping_provider: orderData.shipping_provider,
      shipping_rate_id: orderData.shipping_rate_id,
      shipping_request_token: orderData.shipping_request_token,
      ...fee,
    },
    p_items: orderData.items satisfies PendingOrderItem[],
  })
  if (error || !result?.order_id) {
    console.error("[paystack] create_paid_order failed:", reference, error?.message)
    return { state: "failed", status: 500, error: "Your payment was received but we couldn't save the order yet. Refresh in a moment." }
  }

  await finishOrder(supabase, result.order_id)
  const summary = await getPublicOrderSummary(result.order_id)
  if (!summary) return { state: "failed", status: 500, error: "Order not found" }
  return { state: "confirmed", created: !!result.created, summary }
}

/** Emails (once), delivery of each item (resumable) and courier booking. */
async function finishOrder(supabase: Admin, orderId: string) {
  await sendOrderEmailsOnce(supabase, orderId).catch((e) => console.error("[paystack] order emails failed:", orderId, e))
  await runOrderFulfilment(orderId).catch((e) => console.error("[paystack] fulfilment failed:", orderId, e))

  const { data: order } = await supabase
    .from("orders")
    .update({ shipping_status: "booking" })
    .eq("id", orderId)
    .eq("shipping_status", "pending_booking")
    .select("id, user_id, shipping_provider, shipping_rate_id, shipping_request_token")
    .maybeSingle()
  // Claimed by moving to "booking"; runShipmentBooking records booked or failed.
  if (order?.shipping_provider) await runShipmentBooking(order)
}

async function sendOrderEmailsOnce(supabase: Admin, orderId: string) {
  const { data: order } = await supabase
    .from("orders")
    .update({ emails_sent_at: new Date().toISOString() })
    .eq("id", orderId)
    .is("emails_sent_at", null)
    .select("*, order_items(*)")
    .maybeSingle()
  if (!order) return // another call already sent them

  try {
    const { data: vendorInfo } = await supabase
      .from("users")
      .select("business_name, full_name, store_logo_url, store_brand_color, store_slug, email, phone, business_address")
      .eq("id", order.user_id)
      .single()

    const items = order.order_items ?? []
    const emailItems = await attachItemImages(supabase, items)
    const branding = buildVendorBranding(vendorInfo, order.user_id)
    const { subtotal, deliveryFee } = splitOrderTotal(items, order.total_amount, order.delivery_method)
    const deliveryAddress = formatDeliveryAddress(order)

    const sends: Promise<{ success: boolean }>[] = []
    if (vendorInfo?.email) {
      const email = getNewOrderEmailForVendor({
        orderId: order.id,
        createdAt: order.created_at,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        items: emailItems,
        subtotal,
        deliveryFee,
        totalAmount: order.total_amount,
        deliveryAreaName: order.delivery_area,
        deliveryAddress,
        vendor: branding,
      })
      sends.push(sendEmail({ to: vendorInfo.email, subject: email.subject, html: email.html }))
    }
    const customerEmail = getOrderConfirmationEmailForCustomer({
      customerName: order.customer_name,
      orderId: order.id,
      createdAt: order.created_at,
      items: emailItems,
      subtotal,
      deliveryFee,
      totalAmount: order.total_amount,
      deliveryAreaName: order.delivery_area,
      deliveryAddress,
      paymentReference: order.payment_reference,
      vendor: branding,
    })
    sends.push(sendEmail({ to: order.customer_email, subject: customerEmail.subject, html: customerEmail.html }))

    const results = await Promise.all(sends)
    if (results.some((r) => !r.success)) throw new Error("An order email was not accepted")
  } catch (error) {
    // Let the next call (webhook retry or page refresh) try again.
    await supabase.from("orders").update({ emails_sent_at: null }).eq("id", orderId)
    throw error
  }
}

export async function getPublicOrderSummary(orderId: string): Promise<PublicOrderSummary | null> {
  const supabase = createAdminClient()
  const { data: order } = await supabase
    .from("orders")
    .select("payment_reference, customer_name, customer_email, total_amount, user_id, order_items(product_title, product_type, quantity, variant_label, ticket_tier_name, appointment_date, appointment_time)")
    .eq("id", orderId)
    .maybeSingle()
  if (!order) return null
  const { data: vendor } = await supabase.from("users").select("business_name, full_name, store_slug, phone").eq("id", order.user_id).maybeSingle()

  return {
    reference: order.payment_reference ?? "",
    firstName: (order.customer_name ?? "").trim().split(/\s+/)[0] ?? "",
    emailHint: maskEmail(order.customer_email ?? ""),
    totalAmount: Number(order.total_amount),
    items: (order.order_items ?? []).map((i: any) => ({
      title: i.product_title,
      type: i.product_type,
      quantity: i.quantity,
      variantLabel: i.variant_label,
      tierName: i.ticket_tier_name,
      appointmentDate: i.appointment_date,
      appointmentTime: i.appointment_time,
    })),
    store: {
      name: vendor?.business_name || vendor?.full_name || "the seller",
      slug: vendor?.store_slug ?? null,
      whatsapp: vendor?.phone ? vendor.phone.replace(/\D/g, "") : null,
    },
  }
}
