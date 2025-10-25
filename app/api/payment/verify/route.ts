import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

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

    // Payment successful - create order in database
    const supabase = await createServerClient()
    const paymentData = data.data

    // Get order details from metadata
    const orderData = paymentData.metadata
    console.log("[v0] Order metadata received with", orderData.items?.length || 0, "items")

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
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
      console.error("[v0] Order creation error:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    console.log("[v0] Order created successfully:", order.id)

    const orderItems = await Promise.all(
      orderData.items.map(async (item: any) => {
        let productTitle = item.product_title

        // If product_title is missing, fetch it from the database
        if (!productTitle) {
          console.log("[v0] Product title missing for", item.product_id, "- fetching from database")
          const { data: product } = await supabase
            .from("products")
            .select("title")
            .eq("id", item.product_id)
            .maybeSingle()

          productTitle = product?.title || "Unknown Product"
          console.log("[v0] Fetched product title:", productTitle)
        }

        return {
          order_id: order.id,
          product_id: item.product_id,
          product_title: productTitle,
          product_type: item.product_type,
          quantity: Number(item.quantity),
          price: Number(item.price),
          subtotal: Number(item.subtotal),
        }
      }),
    )

    console.log("[v0] Prepared", orderItems.length, "order items for insertion")

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("[v0] Order items creation error:", itemsError)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    console.log("[v0] Order items created successfully")

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
