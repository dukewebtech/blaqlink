import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
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

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        customer_name,
        customer_email,
        total_amount,
        payment_status,
        created_at,
        order_items (
          product_title,
          product_id,
          quantity,
          price
        )
      `,
      )
      .eq("user_id", userProfile.id)
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) throw error

    // Get product images for each order
    const ordersWithImages = await Promise.all(
      (orders || []).map(async (order) => {
        const firstItem = order.order_items?.[0]
        let productImage = null

        if (firstItem?.product_id) {
          const { data: product } = await supabase
            .from("products")
            .select("images")
            .eq("id", firstItem.product_id)
            .eq("user_id", user.id)
            .single()

          productImage = product?.images?.[0] || null
        }

        return {
          id: order.id,
          product: firstItem?.product_title || "Unknown Product",
          customer: order.customer_name || order.customer_email || "Unknown",
          price: order.total_amount,
          status: order.payment_status,
          image: productImage,
          itemCount: order.order_items?.length || 0,
        }
      }),
    )

    return NextResponse.json(ordersWithImages)
  } catch (error) {
    console.error("[v0] Recent orders error:", error)
    return NextResponse.json({ error: "Failed to fetch recent orders" }, { status: 500 })
  }
}
