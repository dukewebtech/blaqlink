import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, getDigitalDownloadEmailForCustomer, getTicketEmailForCustomer, getSystemUpdateEmail } from "@/lib/email"
import { bookShipment as bookTerminalShipment } from "@/lib/shipping/terminal-africa"
import { createLabel as createShipbubbleLabel } from "@/lib/shipping/shipbubble"
import { getAppUrl } from "@/lib/utils/app-url"
import { formatEventDate } from "@/lib/dates"

type Admin = ReturnType<typeof createAdminClient>

interface ItemRow {
  id: string
  order_id: string
  product_id: string | null
  product_title: string
  product_type: string
  quantity: number
  ticket_tier_id: string | null
  ticket_tier_name: string | null
  download_token: string
  fulfilled_at: string | null
}

interface OrderRow {
  id: string
  user_id: string
  customer_name: string
  customer_email: string
  fulfilment_status: string
  vendor_alerted_at: string | null
}

const CLAIM_TIMEOUT_MS = 2 * 60 * 1000

/**
 * Delivers what each paid item needs: the download link for digital items
 * and one QR ticket per admission for events. (Stock, ticket counts and
 * booking slots were already applied atomically by create_paid_order.)
 *
 * Safe to call any number of times, concurrently: each item is claimed
 * before it's worked on and marked done after, so a retry (webhook, page
 * refresh) only finishes what's left and never sends twice. If anything
 * still fails, the order is flagged and the vendor is emailed once.
 */
export async function runOrderFulfilment(orderId: string): Promise<void> {
  const supabase = createAdminClient()
  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, customer_name, customer_email, fulfilment_status, vendor_alerted_at")
    .eq("id", orderId)
    .single<OrderRow>()
  if (!order) return

  const { data: vendor } = await supabase.from("users").select("business_name, full_name, email").eq("id", order.user_id).single()
  const vendorName = vendor?.business_name || vendor?.full_name || "the seller"

  const { data: items } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, product_title, product_type, quantity, ticket_tier_id, ticket_tier_name, download_token, fulfilled_at")
    .eq("order_id", orderId)
    .returns<ItemRow[]>()

  for (const item of items ?? []) {
    if (item.fulfilled_at) continue
    const claimed = await claimItem(supabase, item.id)
    if (!claimed) continue
    try {
      if (item.product_type === "digital") await fulfilDigital(supabase, order, vendorName, item)
      else if (item.product_type === "event") await fulfilTickets(supabase, order, vendorName, item)
      await supabase.from("order_items").update({ fulfilled_at: new Date().toISOString(), fulfilment_error: null }).eq("id", item.id)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[fulfilment] order_item ${item.id} (${item.product_type}) failed:`, message)
      await supabase.from("order_items").update({ fulfilment_error: message.slice(0, 500), fulfilment_claimed_at: null }).eq("id", item.id)
    }
  }

  const { data: remaining } = await supabase.from("order_items").select("product_title, fulfilment_error").eq("order_id", orderId).is("fulfilled_at", null)
  const failed = (remaining ?? []).filter((r) => r.fulfilment_error)
  if (failed.length === 0 && (remaining ?? []).length === 0) {
    await supabase.from("orders").update({ fulfilment_status: "complete" }).eq("id", orderId)
    return
  }
  if (failed.length > 0) {
    await supabase
      .from("orders")
      .update({
        fulfilment_status: "failed",
        needs_attention: true,
        attention_reason: `We couldn't deliver ${failed.map((f) => f.product_title).join(", ")} automatically. Open the order to resend it.`,
      })
      .eq("id", orderId)
    await alertVendorOnce(supabase, order, vendor?.email ?? null, failed.map((f) => f.product_title))
  }
}

async function claimItem(supabase: Admin, itemId: string): Promise<boolean> {
  const staleBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS).toISOString()
  const { data } = await supabase
    .from("order_items")
    .update({ fulfilment_claimed_at: new Date().toISOString() })
    .eq("id", itemId)
    .is("fulfilled_at", null)
    .or(`fulfilment_claimed_at.is.null,fulfilment_claimed_at.lt.${staleBefore}`)
    .select("id")
  return !!data?.length
}

async function alertVendorOnce(supabase: Admin, order: OrderRow, vendorEmail: string | null, titles: string[]) {
  const { data: claimed } = await supabase
    .from("orders")
    .update({ vendor_alerted_at: new Date().toISOString() })
    .eq("id", order.id)
    .is("vendor_alerted_at", null)
    .select("id")
  if (!claimed?.length || !vendorEmail) return
  const email = getSystemUpdateEmail({
    title: "An order needs your attention",
    message: `${order.customer_name} paid for ${titles.join(", ")}, but we couldn't deliver it automatically.\n\nOpen the order to resend it, or contact the buyer at ${order.customer_email}.`,
    ctaText: "Open order",
    ctaUrl: `${getAppUrl()}/orders/${order.id}`,
  })
  await sendEmail({ to: vendorEmail, subject: email.subject, html: email.html })
}

/** Links carry the item's random token, never a storage path. */
export function downloadUrl(token: string) {
  return `${getAppUrl()}/api/download-digital?token=${token}`
}

async function fulfilDigital(supabase: Admin, order: OrderRow, vendorName: string, item: ItemRow) {
  const { data: product } = await supabase.from("products").select("title, file_urls").eq("id", item.product_id ?? "").maybeSingle()
  const count = product?.file_urls?.length ?? 0
  if (count === 0) throw new Error("The product has no file to deliver")

  const title = product?.title || item.product_title
  const files = Array.from({ length: count }, (_, i) => ({
    title: count > 1 ? `${title} (file ${i + 1})` : title,
    url: `${downloadUrl(item.download_token)}${count > 1 ? `&file=${i}` : ""}`,
  }))
  const email = getDigitalDownloadEmailForCustomer({ customerName: order.customer_name, vendorName, files })
  const sent = await sendEmail({ to: order.customer_email, subject: email.subject, html: email.html })
  if (!sent.success) throw new Error(`Download email not sent: ${sent.error}`)
}

/** One ticket row per admission (idempotent), then one email with every QR. */
async function fulfilTickets(supabase: Admin, order: OrderRow, vendorName: string, item: ItemRow) {
  const { data: product } = await supabase
    .from("products")
    .select("title, event_date, event_location")
    .eq("id", item.product_id ?? "")
    .maybeSingle()

  const rows = Array.from({ length: item.quantity }, (_, i) => ({
    order_id: order.id,
    order_item_id: item.id,
    seq: i + 1,
    product_id: item.product_id,
    vendor_id: order.user_id,
    ticket_tier_id: item.ticket_tier_id,
    holder_name: order.customer_name,
  }))
  const { error: insertError } = await supabase.from("tickets").upsert(rows, { onConflict: "order_item_id,seq", ignoreDuplicates: true })
  if (insertError) throw new Error(`Tickets not created: ${insertError.message}`)

  const { data: tickets } = await supabase.from("tickets").select("code").eq("order_item_id", item.id).order("seq")
  if (!tickets?.length) throw new Error("Tickets not found after creating them")

  const appUrl = getAppUrl()
  const email = getTicketEmailForCustomer({
    customerName: order.customer_name,
    vendorName,
    eventName: product?.title || item.product_title,
    eventDate: product?.event_date ? formatEventDate(product.event_date) : null,
    eventLocation: product?.event_location ?? null,
    tierName: item.ticket_tier_name,
    tickets: tickets.map((t) => ({
      code: t.code,
      url: `${appUrl}/tickets/${t.code}`,
      qrImageUrl: `${appUrl}/api/tickets/${t.code}/qr`,
    })),
  })
  const sent = await sendEmail({ to: order.customer_email, subject: email.subject, html: email.html })
  if (!sent.success) throw new Error(`Ticket email not sent: ${sent.error}`)
}

export interface ShipmentOrder {
  id: string
  user_id: string
  shipping_provider: "terminal_africa" | "shipbubble" | null
  shipping_rate_id: string | null
  shipping_request_token: string | null
}

/**
 * Order-level sibling to runOrderFulfilment (that one loops per order_item;
 * booking a shipment happens once for the whole order). No-op for manual-mode
 * orders (shipping_provider is null). Never throws — failure is recorded on
 * the order as shipping_status: 'failed' for the vendor to retry manually,
 * the same "log loudly, don't block the paid order" approach as the item loop.
 *
 * Each vendor books against their own Terminal Africa / Shipbubble account
 * (no shared platform key), so this looks up the vendor's own API key first.
 */
export async function runShipmentBooking(order: ShipmentOrder): Promise<void> {
  if (!order.shipping_provider || !order.shipping_rate_id) return

  const supabase = createAdminClient()
  try {
    const { data: vendor } = await supabase
      .from("users")
      .select("terminal_africa_api_key, shipbubble_api_key")
      .eq("id", order.user_id)
      .single()

    const apiKey =
      order.shipping_provider === "terminal_africa" ? vendor?.terminal_africa_api_key : vendor?.shipbubble_api_key
    if (!apiKey) throw new Error(`Vendor has no ${order.shipping_provider} API key configured`)

    if (order.shipping_provider === "terminal_africa") {
      const result = await bookTerminalShipment(apiKey, order.shipping_rate_id)
      await supabase
        .from("orders")
        .update({
          shipping_status: "booked",
          shipping_tracking_number: result.trackingNumber,
          shipping_tracking_url: result.trackingUrl,
        })
        .eq("id", order.id)
    } else {
      if (!order.shipping_request_token) throw new Error("Missing Shipbubble request token")
      const result = await createShipbubbleLabel(apiKey, order.shipping_request_token, order.shipping_rate_id)
      await supabase
        .from("orders")
        .update({
          shipping_status: "booked",
          shipping_tracking_number: result.orderId,
          shipping_tracking_url: result.trackingUrl,
        })
        .eq("id", order.id)
    }
  } catch (error) {
    console.error(`[fulfilment] Shipment booking failed for order ${order.id}:`, error)
    await supabase.from("orders").update({ shipping_status: "failed" }).eq("id", order.id)
  }
}
