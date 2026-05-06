import { type NextRequest, NextResponse } from "next/server"
import { verifyCharge } from "@/lib/korapay"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, getNewOrderEmailForVendor, getOrderConfirmationEmailForCustomer } from "@/lib/email"

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
          .select("store_name, business_name, store_logo_url, email, phone, business_address, full_name")
          .eq("id", vendorUserId)
          .single()
        vendorInfo = vendor
      }
    }

    if (!vendorUserId) {
      console.error("[korapay] Could not determine vendor for order")
      return NextResponse.json({ error: "Could not determine vendor for order" }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: vendorUserId,
        customer_email: chargeData.customer.email,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        shipping_address: orderData.shipping_address,
        total_amount: chargeData.amount,
        status: "confirmed",
        payment_reference: reference,
        payment_status: "success",
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
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
    if (itemsError) console.error("[korapay] Order items error:", itemsError.message)

    const emailItems = orderItems.map((i: any) => ({
      product_title: i.product_title,
      quantity: i.quantity,
      price: i.price,
      subtotal: i.subtotal,
    }))

    if (vendorInfo?.email) {
      const vendorEmail = getNewOrderEmailForVendor({
        vendorName: vendorInfo.full_name || vendorInfo.business_name || "Vendor",
        orderId: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        items: emailItems,
        totalAmount: order.total_amount,
        shippingAddress: order.shipping_address,
      })
      sendEmail({ to: vendorInfo.email, subject: vendorEmail.subject, html: vendorEmail.html }).catch(console.error)
    }

    if (order.customer_email) {
      const custEmail = getOrderConfirmationEmailForCustomer({
        customerName: order.customer_name,
        orderId: order.id,
        items: emailItems,
        totalAmount: order.total_amount,
        vendorName: vendorInfo?.store_name || vendorInfo?.business_name || "Seller",
        vendorEmail: vendorInfo?.email,
        paymentReference: reference,
        shippingAddress: order.shipping_address,
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
