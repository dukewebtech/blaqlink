import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all orders for financial analysis
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        *,
        users!orders_user_id_fkey (
          id,
          business_name
        )
      `,
      )
      .in("payment_status", ["paid", "success", "completed"])

    if (ordersError) {
      console.error("[v0] Error fetching orders for reports:", ordersError)
      return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 })
    }

    // Calculate revenue by store
    const revenueByStore: Record<string, { storeName: string; revenue: number; orders: number }> = {}

    orders?.forEach((order) => {
      const storeId = order.user_id
      const storeName = order.users?.business_name || "Unknown Store"
      const revenue = Number.parseFloat(order.total_amount || "0")

      if (!revenueByStore[storeId]) {
        revenueByStore[storeId] = { storeName, revenue: 0, orders: 0 }
      }

      revenueByStore[storeId].revenue += revenue
      revenueByStore[storeId].orders += 1
    })

    // Calculate revenue by month
    const revenueByMonth: Record<string, number> = {}
    orders?.forEach((order) => {
      const month = new Date(order.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
      const revenue = Number.parseFloat(order.total_amount || "0")
      revenueByMonth[month] = (revenueByMonth[month] || 0) + revenue
    })

    // Total metrics
    const totalRevenue = orders?.reduce((sum, order) => sum + Number.parseFloat(order.total_amount || "0"), 0)
    const totalOrders = orders?.length || 0

    console.log(`[v0] Admin reports generated: ${totalOrders} orders analyzed`)

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      revenueByStore: Object.values(revenueByStore),
      revenueByMonth,
    })
  } catch (error) {
    console.error("[v0] Admin reports error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
