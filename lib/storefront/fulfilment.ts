import QRCode from "qrcode"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, getDigitalDownloadEmailForCustomer, getTicketEmailForCustomer } from "@/lib/email"

export interface FulfilmentOrderItem {
  id: string
  product_id: string
  product_title: string
  product_type: string // physical | event | appointment | digital
  quantity: number
  product_variant_id: string | null
  ticket_tier_id: string | null
  ticket_tier_name: string | null
  appointment_date: string | null
  appointment_time: string | null
}

export interface FulfilmentContext {
  orderId: string
  customerName: string
  customerEmail: string
  vendorName: string
}

/**
 * Runs the type-specific follow-up for a paid order: email the digital file,
 * issue the QR ticket, hold the booking slot, and decrement whatever stock
 * the purchase used. Vendor notification is a separate, already-existing
 * email sent by the verify route for every order regardless of type.
 */
export async function runOrderFulfilment(ctx: FulfilmentContext, items: FulfilmentOrderItem[]): Promise<void> {
  const supabase = createAdminClient()

  for (const item of items) {
    try {
      if (item.product_type === "digital") {
        await fulfilDigital(supabase, ctx, item)
      } else if (item.product_type === "event") {
        await fulfilTicket(supabase, ctx, item)
      } else if (item.product_type === "appointment") {
        await fulfilBooking(supabase, item)
      } else if (item.product_type === "physical") {
        await decrementPhysicalStock(supabase, item)
      }
    } catch (error) {
      // One item's fulfilment failing shouldn't block the others — the order is
      // already paid; log loudly so it can be resolved manually.
      console.error(`[fulfilment] Failed for order_item ${item.id} (${item.product_type}):`, error)
    }
  }
}

async function fulfilDigital(supabase: ReturnType<typeof createAdminClient>, ctx: FulfilmentContext, item: FulfilmentOrderItem) {
  const { data: product } = await supabase
    .from("products")
    .select("title, file_urls")
    .eq("id", item.product_id)
    .single()

  const fileUrls: string[] = product?.file_urls ?? []
  if (fileUrls.length === 0) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blaqora.store"
  const files = fileUrls.map((url) => ({
    title: product?.title || item.product_title,
    url: `${appUrl}/api/download-digital?path=${encodeURIComponent(url)}&orderId=${ctx.orderId}`,
  }))

  const email = getDigitalDownloadEmailForCustomer({
    customerName: ctx.customerName,
    vendorName: ctx.vendorName,
    files,
  })

  await sendEmail({ to: ctx.customerEmail, subject: email.subject, html: email.html })
}

async function fulfilTicket(supabase: ReturnType<typeof createAdminClient>, ctx: FulfilmentContext, item: FulfilmentOrderItem) {
  const { data: product } = await supabase
    .from("products")
    .select("title, event_date, event_location")
    .eq("id", item.product_id)
    .single()

  // "Quantity left" decrement — atomic, guarded so it can't oversell a tier.
  if (item.ticket_tier_id) {
    const { data: ok } = await supabase.rpc("increment_ticket_tier_sold", {
      p_tier_id: item.ticket_tier_id,
      p_qty: item.quantity,
    })
    if (!ok) {
      console.error(`[fulfilment] Ticket tier ${item.ticket_tier_id} oversold on order_item ${item.id}`)
    }
  }

  const ticketReference = item.id
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blaqora.store"
  const qrDataUrl = await QRCode.toDataURL(`${appUrl}/tickets/${ticketReference}`, { margin: 1, width: 440 })

  const email = getTicketEmailForCustomer({
    customerName: ctx.customerName,
    vendorName: ctx.vendorName,
    eventName: product?.title || item.product_title,
    eventDate: product?.event_date ?? null,
    eventLocation: product?.event_location ?? null,
    tierName: item.ticket_tier_name,
    quantity: item.quantity,
    qrDataUrl,
    ticketReference,
  })

  await sendEmail({ to: ctx.customerEmail, subject: email.subject, html: email.html })
}

/**
 * "Hold" the slot: the order_item's appointment_date/time IS the hold — there's
 * no separate capacity table. This only checks for (and logs) the rare case of
 * two paid orders landing on the same slot, since two customers could complete
 * checkout for it concurrently before either payment settles.
 */
async function fulfilBooking(supabase: ReturnType<typeof createAdminClient>, item: FulfilmentOrderItem) {
  if (!item.appointment_date || !item.appointment_time) return

  const { data: clashes } = await supabase
    .from("order_items")
    .select("id, order_id, orders!inner(payment_status)")
    .eq("product_id", item.product_id)
    .eq("appointment_date", item.appointment_date)
    .eq("appointment_time", item.appointment_time)
    .eq("orders.payment_status", "success")
    .neq("id", item.id)

  if (clashes && clashes.length > 0) {
    console.error(
      `[fulfilment] Booking slot double-booked: product ${item.product_id} at ${item.appointment_date} ${item.appointment_time} (order_items: ${[item.id, ...clashes.map((c) => c.id)].join(", ")})`,
    )
  }
}

async function decrementPhysicalStock(supabase: ReturnType<typeof createAdminClient>, item: FulfilmentOrderItem) {
  if (item.product_variant_id) {
    const { data: ok } = await supabase.rpc("decrement_variant_stock", {
      p_variant_id: item.product_variant_id,
      p_qty: item.quantity,
    })
    if (!ok) console.error(`[fulfilment] Variant ${item.product_variant_id} oversold on order_item ${item.id}`)
  } else {
    const { data: ok } = await supabase.rpc("decrement_product_stock", {
      p_product_id: item.product_id,
      p_qty: item.quantity,
    })
    if (ok === false) console.error(`[fulfilment] Product ${item.product_id} oversold on order_item ${item.id}`)
  }
}
