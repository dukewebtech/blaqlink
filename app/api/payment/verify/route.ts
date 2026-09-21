import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, getNewOrderEmailForVendor, getOrderConfirmationEmailForCustomer } from "@/lib/email"
import { getVendorPlan, computeOrderFee } from "@/lib/pricing"
import { runOrderFulfilment, runShipmentBooking } from "@/lib/storefront/fulfilment"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get("reference")

    console.log("[v0] Payment verification - Reference:", reference)

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const data = await response.json()
    console.log("[v0] Paystack verification response:", data.status ? "Verification successful" : "Verification failed")

    if (!data.status || data.data.status !== "success") {
      console.error("[v0] Payment verification failed:", data)
      return NextResponse.json({ error: "Payment verification failed", data }, { status: 400 })
    }

    const supabase = createAdminClient()
    const paymentData = data.data

    // Get order details from metadata
    const orderData = paymentData.metadata
    console.log("[v0] Order metadata:", JSON.stringify(orderData).substring(0, 200) + "...")

    // This assumes all products in an order belong to the same vendor
    let vendorUserId = null
    let vendorInfo = null
    if (orderData.items && orderData.items.length > 0) {
      const firstProductId = orderData.items[0].product_id
      const { data: product } = await supabase.from("products").select("user_id").eq("id", firstProductId).single()

      vendorUserId = product?.user_id

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
      console.error("[v0] Could not determine vendor for order")
      return NextResponse.json({ error: "Could not determine vendor for order" }, { status: 400 })
    }

    // Idempotency — return existing order if already created for this reference
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("payment_reference", reference)
      .maybeSingle()

    if (existing) {
      console.log("[v0] Order already exists for reference:", reference)
      const { data: order } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", existing.id)
        .single()
      return NextResponse.json({ success: true, order_id: existing.id, reference, order })
    }

    const totalAmount = paymentData.amount / 100 // Convert from kobo
    const vendorPlan = await getVendorPlan(vendorUserId)
    const fee = computeOrderFee(totalAmount, vendorPlan)

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: vendorUserId,
        customer_email: paymentData.customer.email,
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
        total_amount: totalAmount,
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
      console.error("[v0] Order creation error:", orderError.message)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    console.log("[v0] Order created successfully:", order.id)

    // Create order items
    const orderItems = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_title: item.product_title,
      product_type: item.product_type,
      quantity: Number.parseInt(item.quantity),
      price: Number.parseFloat(item.price),
      subtotal: Number.parseFloat(item.subtotal),
      product_variant_id: item.product_variant_id || null,
      variant_label: item.variant_label || null,
      ticket_tier_id: item.ticket_tier_id || null,
      ticket_tier_name: item.ticket_tier_name || null,
      appointment_date: item.appointment_date || null,
      appointment_time: item.appointment_time || null,
    }))

    const { data: insertedItems, error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)
      .select()

    if (itemsError) {
      console.error("[v0] Order items creation error:", itemsError.message)
    } else {
      console.log("[v0] Order items created successfully:", orderItems.length, "items")
    }

    if (insertedItems && insertedItems.length > 0) {
      runOrderFulfilment(
        {
          orderId: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          vendorName: vendorInfo?.business_name || vendorInfo?.full_name || "the seller",
        },
        insertedItems,
      ).catch((err) => console.error("[v0] Fulfilment error:", err))
    }

    if (order.shipping_provider) {
      runShipmentBooking(order).catch((err) => console.error("[v0] Shipment booking error:", err))
    }

    const productIds = orderData.items.map((item: any) => item.product_id)
    const { data: products } = await supabase
      .from("products")
      .select(
        "id, title, product_type, images, file_urls, event_date, event_location, duration_minutes, booking_link, license_type, download_limit",
      )
      .in("id", productIds)

    // Merge product details with order items
    const itemsWithDetails = orderData.items.map((item: any) => {
      const product = products?.find((p) => p.id === item.product_id)
      return {
        ...item,
        product_details: product || null,
        appointment_date: item.appointment_date,
        appointment_time: item.appointment_time,
      }
    })

    const emailItems = orderItems.map((item: any) => ({
      product_title: item.product_title,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    }))

    // Send email to vendor about new order
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

      sendEmail({
        to: vendorInfo.email,
        subject: vendorEmail.subject,
        html: vendorEmail.html,
      }).catch((err) => console.error("[v0] Failed to send vendor email:", err))
    }

    // Send confirmation email to customer
    if (order.customer_email) {
      const customerEmail = getOrderConfirmationEmailForCustomer({
        customerName: order.customer_name,
        orderId: order.id,
        items: emailItems,
        totalAmount: order.total_amount,
        vendorName: vendorInfo?.store_name || vendorInfo?.business_name || "Seller",
        vendorEmail: vendorInfo?.email,
        paymentReference: reference,
        shippingAddress: order.shipping_address,
      })

      sendEmail({
        to: order.customer_email,
        subject: customerEmail.subject,
        html: customerEmail.html,
      }).catch((err) => console.error("[v0] Failed to send customer email:", err))
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      reference,
      amount: paymentData.amount / 100,
      order: {
        id: order.id,
        created_at: order.created_at,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        shipping_address: order.shipping_address,
        total_amount: order.total_amount,
        payment_reference: reference,
        status: order.status,
        items: itemsWithDetails,
      },
      vendor: vendorInfo,
    })
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
