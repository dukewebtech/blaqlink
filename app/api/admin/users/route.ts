import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Fetch all users with their statistics
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (usersError) {
      console.error("[v0] Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Fetch product counts and revenue for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const [productsResult, ordersResult] = await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("orders").select("total_amount, payment_status").eq("user_id", user.id),
        ])

        const productCount = productsResult.count || 0
        const successfulOrders =
          ordersResult.data?.filter((order) => order.payment_status === "success" || order.payment_status === "paid") ||
          []
        const totalRevenue = successfulOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
        const orderCount = successfulOrders.length

        return {
          ...user,
          productCount,
          orderCount,
          totalRevenue,
        }
      }),
    )

    console.log("[v0] Admin users fetched:", usersWithStats.length)

    return NextResponse.json({ users: usersWithStats })
  } catch (error) {
    console.error("[v0] Error in admin users API:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
