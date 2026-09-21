import { type NextRequest, NextResponse } from "next/server"
import { verifyCharge } from "@/lib/korapay"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, getNewOrderEmailForVendor, getOrderConfirmationEmailForCustomer } from "@/lib/email"
import { getVendorPlan, computeOrderFee } from "@/lib/pricing"
import { runOrderFulfilment, runShipmentBooking } from "@/lib/storefront/fulfilment"
import { attachItemImages, buildVendorBranding, splitOrderTotal, formatDeliveryAddress } from "@/lib/storefront/order-emails"

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference")
    console.log("[korapay] Verifying charge:", reference)

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    const data = await verifyCharge(reference)
    console.log("[korapay] Verify response status:", data.status, "charge status:", data.data?.status)

    if (!data.status || data.data?.status !== "success") {
      console.error("[korapay] Charge verification failed:", data)
      return NextResponse.json({ error: "Payment verification failed", data }, { status: 400 })
    }

    const chargeData = data.data
    const supabase = createAdminClient()

    // Fetch order data from the payment session saved during initialize
    const { data: session } = await supabase
      .from("payment_sessions")
      .select("order_data")
      .eq("reference", reference)
      .maybeSingle()

    const orderData = session?.order_data ?? chargeData.metadata ?? {}

    // Idempotency — skip if order already created for this reference
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("payment_reference", reference)
      .maybeSingle()

    if (existing) {
      console.log("[korapay] Order already exists for reference:", reference)
      const { data: order } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", existing.id)
        .single()
      return NextResponse.json({ success: true, order_id: existing.id, reference, order })
    }

    // Resolve vendor
    let vendorUserId: string | null = null
    let vendorInfo: any = null

    if (orderData?.items?.length) {
      const { data: product } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", orderData.items[0].product_id)
        .single()
      vendorUserId = product?.user_id ?? null

      if (vendorUserId) {
        const { data: vendor } = await supabase
          .from("users")
          .select("business_name, full_name, store_logo_url, store_brand_color, store_slug, email, phone, business_address")
          .eq("id", vendorUserId)
          .single()
        vendorInfo = vendor
      }
    }

    if (!vendorUserId) {
      console.error("[korapay] Could not determine vendor for order")
      return NextResponse.json({ error: "Could not determine vendor for order" }, { status: 400 })
    }

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
      console.error("[korapay] Order creation error:", orderError.message)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    console.log("[korapay] Order created:", order.id)

    // Clean up the temporary payment session
    supabase.from("payment_sessions").delete().eq("reference", reference).then(() => {})

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

    const { data: insertedItems, error: itemsError } = await supabase.from("order_items").insert(orderItems).select()
    if (itemsError) console.error("[korapay] Order items error:", itemsError.message)

    if (insertedItems && insertedItems.length > 0) {
      runOrderFulfilment(
        {
          orderId: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          vendorName: vendorInfo?.business_name || vendorInfo?.full_name || "the seller",
        },
        insertedItems,
      ).catch((err) => console.error("[korapay] Fulfilment error:", err))
    }

    if (order.shipping_provider) {
      runShipmentBooking(order).catch((err) => console.error("[korapay] Shipment booking error:", err))
    }

    const emailItems = await attachItemImages(supabase, orderItems)
    const branding = buildVendorBranding(vendorInfo, vendorUserId)
    const { subtotal, deliveryFee } = splitOrderTotal(orderItems, order.total_amount, order.delivery_method)
    const deliveryAddress = formatDeliveryAddress(order)

    if (vendorInfo?.email) {
      const vendorEmail = getNewOrderEmailForVendor({
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
      sendEmail({ to: vendorInfo.email, subject: vendorEmail.subject, html: vendorEmail.html }).catch(console.error)
    }

    if (order.customer_email) {
      const custEmail = getOrderConfirmationEmailForCustomer({
        customerName: order.customer_name,
        orderId: order.id,
        createdAt: order.created_at,
        items: emailItems,
        subtotal,
        deliveryFee,
        totalAmount: order.total_amount,
        deliveryAreaName: order.delivery_area,
        deliveryAddress,
        paymentReference: reference,
        vendor: branding,
      })
      sendEmail({ to: order.customer_email, subject: custEmail.subject, html: custEmail.html }).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      reference,
      amount: chargeData.amount,
      order: { ...order, items: orderItems },
      vendor: vendorInfo,
    })
  } catch (error) {
    console.error("[korapay] Verify error:", error)
    return NextResponse.json({ error: "Failed to verify KoraPay payment" }, { status: 500 })
  }
}
