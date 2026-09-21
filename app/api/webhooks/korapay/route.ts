import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { verifyCharge } from "@/lib/korapay"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, getNewOrderEmailForVendor, getOrderConfirmationEmailForCustomer } from "@/lib/email"
import { getVendorPlan, computeOrderFee } from "@/lib/pricing"
import { runOrderFulfilment, runShipmentBooking } from "@/lib/storefront/fulfilment"

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.KORA_SECRET_KEY
  if (!secret) return false
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-korapay-signature") ?? ""

    if (!verifySignature(rawBody, signature)) {
      console.error("[korapay/webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const { event, data } = payload

    console.log("[korapay/webhook] Event received:", event, "Reference:", data?.reference)

    const supabase = createAdminClient()

    // ── Collection success ────────────────────────────────────────────────────
    if (event === "charge.success") {
      const reference = data.reference

      // Idempotency check
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("payment_reference", reference)
        .maybeSingle()

      if (existing) {
        console.log("[korapay/webhook] Order already exists:", existing.id)
        return NextResponse.json({ received: true })
      }

      // Verify the charge directly
      const verifyRes = await verifyCharge(reference)
      if (!verifyRes.status || verifyRes.data?.status !== "success") {
        console.error("[korapay/webhook] Charge not successful on re-verify")
        return NextResponse.json({ received: true })
      }

      const chargeData = verifyRes.data
      const rawMeta = chargeData.metadata ?? {}
      const orderData = rawMeta.order_data ? JSON.parse(rawMeta.order_data as string) : rawMeta

      if (!orderData?.items?.length) {
        console.error("[korapay/webhook] No order metadata on charge")
        return NextResponse.json({ received: true })
      }

      const { data: product } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", orderData.items[0].product_id)
        .single()
      const vendorUserId = product?.user_id

      if (!vendorUserId) {
        console.error("[korapay/webhook] Could not resolve vendor")
        return NextResponse.json({ received: true })
      }

      const { data: vendorInfo } = await supabase
        .from("users")
        .select("store_name, business_name, store_logo_url, email, full_name")
        .eq("id", vendorUserId)
        .single()

      const vendorPlan = await getVendorPlan(vendorUserId)
      const fee = computeOrderFee(chargeData.amount, vendorPlan)

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: vendorUserId,
          customer_email: chargeData.customer.email,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          shipping_address: orderData.shipping_address,
          delivery_method: orderData.delivery_method || null,
          delivery_area: orderData.delivery_area || null,
          delivery_address: orderData.delivery_address || null,
          delivery_state: orderData.delivery_state || null,
          delivery_city: orderData.delivery_city || null,
          delivery_postal_code: orderData.delivery_postal_code || null,
          customer_note: orderData.customer_note || null,
          total_amount: chargeData.amount,
          status: "confirmed",
          payment_reference: reference,
          payment_status: "success",
          shipping_provider: orderData.shipping_provider || null,
          shipping_rate_id: orderData.shipping_rate_id || null,
          shipping_request_token: orderData.shipping_request_token || null,
          shipping_status: orderData.shipping_provider ? "pending_booking" : null,
          ...fee,
        })
        .select()
        .single()

      if (orderError) {
        console.error("[korapay/webhook] Order creation error:", orderError.message)
        return NextResponse.json({ received: true })
      }

      const orderItems = orderData.items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_title: item.product_title,
        product_type: item.product_type,
        quantity: Number(item.quantity),
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product_variant_id: item.product_variant_id || null,
        variant_label: item.variant_label || null,
        ticket_tier_id: item.ticket_tier_id || null,
        ticket_tier_name: item.ticket_tier_name || null,
        appointment_date: item.appointment_date || null,
        appointment_time: item.appointment_time || null,
      }))
      const { data: insertedItems } = await supabase.from("order_items").insert(orderItems).select()

      if (insertedItems && insertedItems.length > 0) {
        runOrderFulfilment(
          {
            orderId: order.id,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            vendorName: vendorInfo?.business_name || vendorInfo?.full_name || "the seller",
          },
          insertedItems,
        ).catch((err) => console.error("[korapay/webhook] Fulfilment error:", err))
      }

      if (order.shipping_provider) {
        runShipmentBooking(order).catch((err) => console.error("[korapay/webhook] Shipment booking error:", err))
      }

      const emailItems = orderItems.map((i: any) => ({
        product_title: i.product_title,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.subtotal,
      }))

      if (vendorInfo?.email) {
        const ve = getNewOrderEmailForVendor({
          vendorName: vendorInfo.full_name || vendorInfo.business_name || "Vendor",
          orderId: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          items: emailItems,
          totalAmount: order.total_amount,
          shippingAddress: order.shipping_address,
        })
        sendEmail({ to: vendorInfo.email, subject: ve.subject, html: ve.html }).catch(console.error)
      }
      if (order.customer_email) {
        const ce = getOrderConfirmationEmailForCustomer({
          customerName: order.customer_name,
          orderId: order.id,
          items: emailItems,
          totalAmount: order.total_amount,
          vendorName: vendorInfo?.store_name || vendorInfo?.business_name || "Seller",
          vendorEmail: vendorInfo?.email,
          paymentReference: reference,
          shippingAddress: order.shipping_address,
        })
        sendEmail({ to: order.customer_email, subject: ce.subject, html: ce.html }).catch(console.error)
      }

      console.log("[korapay/webhook] Order created via webhook:", order.id)
    }

    // ── Disbursement success ──────────────────────────────────────────────────
    if (event === "transfer.success") {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "approved",
          kora_payout_status: "success",
          updated_at: new Date().toISOString(),
        })
        .eq("kora_payout_reference", data.reference)

      if (error) console.error("[korapay/webhook] Disbursement success update error:", error.message)
      else console.log("[korapay/webhook] Withdrawal approved via webhook:", data.reference)
    }

    // ── Disbursement failed ───────────────────────────────────────────────────
    if (event === "transfer.failed") {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          kora_payout_status: "failed",
          admin_notes: `KoraPay disbursement failed: ${data.narration ?? "no details"}`,
          updated_at: new Date().toISOString(),
        })
        .eq("kora_payout_reference", data.reference)

      if (error) console.error("[korapay/webhook] Disbursement failed update error:", error.message)
      else console.log("[korapay/webhook] Withdrawal marked failed via webhook:", data.reference)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[korapay/webhook] Handler error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
