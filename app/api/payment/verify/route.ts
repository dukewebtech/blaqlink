import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

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
    if (orderData.items && orderData.items.length > 0) {
      const firstProductId = orderData.items[0].product_id
      const { data: product } = await supabase.from("products").select("user_id").eq("id", firstProductId).single()

      vendorUserId = product?.user_id
    }

    if (!vendorUserId) {
      console.error("[v0] Could not determine vendor for order")
      return NextResponse.json({ error: "Could not determine vendor for order" }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: vendorUserId,
        customer_email: paymentData.customer.email,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        shipping_address: orderData.shipping_address,
        total_amount: paymentData.amount / 100, // Convert from kobo
        status: "confirmed",
        payment_reference: reference,
        payment_status: "success",
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
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("[v0] Order items creation error:", itemsError.message)
    } else {
      console.log("[v0] Order items created successfully:", orderItems.length, "items")
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      reference,
      amount: paymentData.amount / 100,
    })
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
