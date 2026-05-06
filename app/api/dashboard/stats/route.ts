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

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("total_amount, payment_status, created_at")
      .eq("user_id", userProfile.id)
      .in("payment_status", ["success", "paid"])

    console.log("[v0] Dashboard stats - Orders with success/paid status:", orders?.length || 0)
    console.log("[v0] Dashboard stats - Orders data:", orders)

    if (ordersError) {
      console.error("[v0] Dashboard stats - Orders error:", ordersError)
      throw ordersError
    }

    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
    console.log("[v0] Dashboard stats - Total revenue:", totalRevenue)

    const { data: customers, error: customersError } = await supabase
      .from("orders")
      .select("customer_email")
      .eq("user_id", userProfile.id)
      .not("customer_email", "is", null)

    if (customersError) throw customersError

    const uniqueCustomers = new Set(customers?.map((c) => c.customer_email)).size
    console.log("[v0] Dashboard stats - Unique customers:", uniqueCustomers)

    const { count: totalTransactions, error: transactionsError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userProfile.id)

    console.log("[v0] Dashboard stats - Total transactions:", totalTransactions)

    if (transactionsError) throw transactionsError

    const { count: totalProducts, error: productsError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    console.log("[v0] Dashboard stats - Total products:", totalProducts)

    if (productsError) throw productsError

    // Calculate weekly changes (compare last 7 days vs previous 7 days)
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const { data: lastWeekOrders } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("user_id", userProfile.id)
      .in("payment_status", ["success", "paid"])
      .gte("created_at", lastWeek.toISOString())

    const { data: previousWeekOrders } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("user_id", userProfile.id)
      .in("payment_status", ["success", "paid"])
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", lastWeek.toISOString())

    const lastWeekRevenue = lastWeekOrders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0
    const previousWeekRevenue = previousWeekOrders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0
    const revenueChange =
      previousWeekRevenue > 0 ? ((lastWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 : 0

    return NextResponse.json({
      totalRevenue,
      totalCustomers: uniqueCustomers,
      totalTransactions: totalTransactions || 0,
      totalProducts: totalProducts || 0,
      revenueChange: revenueChange.toFixed(2),
    })
  } catch (error) {
    console.error("[v0] Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
