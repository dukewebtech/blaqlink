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

    // Previously 6 separate round trips against `orders` (revenue sum, unique
    // customers, transaction count, this-week revenue, last-week revenue —
    // each re-querying the same table). One fetch of just the columns every
    // metric below needs, computed in JS, is functionally identical and cuts
    // this endpoint's query count from 8 round trips to 4.
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("total_amount, payment_status, customer_email, created_at")
      .eq("user_id", userProfile.id)

    if (ordersError) {
      console.error("[v0] Dashboard stats - Orders error:", ordersError)
      throw ordersError
    }

    const { count: totalProducts, error: productsError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (productsError) throw productsError

    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const isPaid = (o: { payment_status: string | null }) => o.payment_status === "success" || o.payment_status === "paid"

    const totalRevenue = orders?.filter(isPaid).reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0
    const uniqueCustomers = new Set(orders?.filter((o) => o.customer_email).map((o) => o.customer_email)).size
    const totalTransactions = orders?.length || 0

    const lastWeekRevenue =
      orders
        ?.filter((o) => isPaid(o) && new Date(o.created_at) >= lastWeek)
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0
    const previousWeekRevenue =
      orders
        ?.filter((o) => isPaid(o) && new Date(o.created_at) >= twoWeeksAgo && new Date(o.created_at) < lastWeek)
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0
    const revenueChange =
      previousWeekRevenue > 0 ? ((lastWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 : 0

    return NextResponse.json({
      totalRevenue,
      totalCustomers: uniqueCustomers,
      totalTransactions,
      totalProducts: totalProducts || 0,
      revenueChange: revenueChange.toFixed(2),
    })
  } catch (error) {
    console.error("[v0] Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
