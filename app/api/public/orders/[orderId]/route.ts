import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(_request: Request, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params
    const supabase = createAdminClient()

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Fetch vendor info (store name, logo) for display
    const { data: vendor } = await supabase
      .from("users")
      .select("store_name, business_name, store_logo_url, email, phone")
      .eq("id", order.user_id)
      .single()

    return NextResponse.json({ order, vendor })
  } catch (error) {
    console.error("[v0] Public order fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
