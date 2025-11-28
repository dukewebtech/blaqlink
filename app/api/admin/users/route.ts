import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Fetch all users
    const { data: users, error: usersError } = await adminClient
      .from("users")
      .select("id, full_name, business_name, email, phone, role, is_admin, created_at")
      .order("created_at", { ascending: false })

    if (usersError) throw usersError

    // Fetch stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Count products
        const { count: productCount } = await adminClient
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Count orders
        const { count: orderCount } = await adminClient
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Calculate total revenue
        const { data: orders } = await adminClient
          .from("orders")
          .select("total_amount")
          .eq("user_id", user.id)
          .in("payment_status", ["paid", "success"])

        const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0

        return {
          ...user,
          total_products: productCount || 0,
          total_orders: orderCount || 0,
          total_revenue: totalRevenue,
        }
      }),
    )

    return NextResponse.json({ users: usersWithStats })
  } catch (error) {
    console.error("[v0] Admin users API error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
