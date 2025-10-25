import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get all orders with order items
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          product_title,
          product_type,
          quantity,
          price,
          subtotal
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Orders fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Fetched orders count:", orders?.length || 0)
    orders?.forEach((order) => {
      console.log(`[v0] Order ${order.id.slice(0, 8)} has ${order.order_items?.length || 0} items`)
      if (order.order_items && order.order_items.length > 0) {
        console.log(`[v0] Order items:`, order.order_items)
      }
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("[v0] Orders API error:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, status } = body

    if (!order_id || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", order_id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Order update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ order: data })
  } catch (error) {
    console.error("[v0] Order update API error:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
