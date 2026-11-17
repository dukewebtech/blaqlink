import { createAdminClient } from "@/lib/supabase/server"
import { refundTransaction } from "@/lib/paystack"
import { sendEmail, getSystemUpdateEmail } from "@/lib/email"
import { formatNaira } from "@/lib/money"

export type RefundResult = { ok: true } | { ok: false; status: number; error: string }

/**
 * Full refund to the buyer through Paystack, then mark_order_refunded:
 * the sale stops counting toward the vendor's balance (the fee is kept, per
 * the Refund Policy), tickets stop working and capacity/slots go back on sale.
 * vendorId limits it to the vendor's own orders; admins pass null.
 */
export async function refundOrder(orderId: string, vendorId: string | null): Promise<RefundResult> {
  const supabase = createAdminClient()
  let query = supabase
    .from("orders")
    .select("id, user_id, payment_reference, payment_status, total_amount, customer_email, customer_name")
    .eq("id", orderId)
  if (vendorId) query = query.eq("user_id", vendorId)
  const { data: order } = await query.maybeSingle()

  if (!order) return { ok: false, status: 404, error: "Order not found." }
  if (order.payment_status === "refunded") return { ok: false, status: 409, error: "This order has already been refunded." }
  if (order.payment_status !== "success" || !order.payment_reference) {
    return { ok: false, status: 409, error: "Only paid orders can be refunded." }
  }

  const paystack = await refundTransaction(order.payment_reference).catch(() => null)
  const alreadyRefunded = /already.*refund|fully reversed/i.test(paystack?.message ?? "")
  if (!paystack?.status && !alreadyRefunded) {
    console.error("[refund] Paystack refused:", order.id, paystack?.message)
    return { ok: false, status: 502, error: paystack?.message ? `Paystack: ${paystack.message}` : "We couldn't reach Paystack. Try again in a moment." }
  }

  const { data: marked, error } = await supabase.rpc("mark_order_refunded", {
    p_order: order.id,
    p_refund_reference: String(paystack?.data?.id ?? paystack?.data?.transaction?.reference ?? order.payment_reference),
  })
  if (error || !marked?.ok) {
    // Paystack has the refund; flag it so the books get fixed by hand.
    console.error("[refund] Paystack refunded but marking failed:", order.id, error?.message ?? marked?.message)
    await supabase
      .from("orders")
      .update({ needs_attention: true, attention_reason: "Refunded in Paystack but not recorded here. Contact support." })
      .eq("id", order.id)
    return { ok: false, status: 500, error: "The refund was sent, but we couldn't update the order. Support has been flagged." }
  }

  const email = getSystemUpdateEmail({
    recipientName: order.customer_name,
    title: "Your refund is on its way",
    message: `We've refunded ${formatNaira(order.total_amount)} for your order (reference ${order.payment_reference}). It usually reaches your card or account in 5 to 10 working days, depending on your bank.\n\nAny tickets from this order no longer work.`,
  })
  await sendEmail({ to: order.customer_email, subject: email.subject, html: email.html }).catch(() => {})

  return { ok: true }
}
