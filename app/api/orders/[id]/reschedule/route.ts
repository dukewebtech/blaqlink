import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/utils/api-helpers"
import { bookingSlotError } from "@/lib/storefront/checkout-lines"
import { sendEmail, getSystemUpdateEmail } from "@/lib/email"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Vendor moves a booking to another free time; the buyer is emailed.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedUser()
  if (!auth.success) return auth.error
  const { id } = await params
  const body = await request.json().catch(() => null)
  const itemId = body?.itemId
  const date = body?.date
  const time = body?.time
  if (!UUID_RE.test(String(itemId)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d{2}:\d{2}$/.test(String(time))) {
    return NextResponse.json({ error: "Pick a new date and time." }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: item } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, product_title, appointment_date, appointment_time, orders!inner(user_id, customer_email, customer_name, payment_reference)")
    .eq("id", itemId)
    .eq("order_id", id)
    .maybeSingle()
  const order = item?.orders as unknown as { user_id: string; customer_email: string; customer_name: string; payment_reference: string } | undefined
  if (!item || !order || order.user_id !== auth.user.userId) return NextResponse.json({ error: "Booking not found." }, { status: 404 })

  const { data: product } = await supabase.from("products").select("available_days, time_slots").eq("id", item.product_id).maybeSingle()
  const slotError = product ? bookingSlotError(product, date, time) : "This service no longer exists."
  if (slotError) return NextResponse.json({ error: slotError }, { status: 400 })

  const { data: result, error } = await supabase.rpc("reschedule_booking", { p_item: itemId, p_vendor: auth.user.userId, p_date: date, p_time: time })
  if (error) {
    console.error("[reschedule] failed:", error.message)
    return NextResponse.json({ error: "We couldn't move this booking. Try again." }, { status: 500 })
  }
  if (!result?.ok) return NextResponse.json({ error: result?.message ?? "We couldn't move this booking." }, { status: 409 })

  const when = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00+01:00`))
  const email = getSystemUpdateEmail({
    recipientName: order.customer_name,
    title: "Your booking has moved",
    message: `Your booking for ${item.product_title} is now on ${when} at ${time} (Lagos time).\n\nIf this time doesn't work for you, reply to the seller to arrange another, or ask for a refund. Reference: ${order.payment_reference}.`,
  })
  await sendEmail({ to: order.customer_email, subject: email.subject, html: email.html }).catch(() => {})
  return NextResponse.json({ ok: true })
}
