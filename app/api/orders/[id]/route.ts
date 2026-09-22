import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Was previously covered by GET /api/orders, which the order detail page
// called and then .find()'d the one order out of the vendor's entire order
// history. Fetches just this one row instead.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const { data: order, error } = await supabase
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
      .eq("id", id)
      .eq("user_id", userProfile.id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Order fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("[v0] Order API error:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}
