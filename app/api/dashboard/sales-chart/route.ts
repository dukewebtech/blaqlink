import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get orders from the last 12 months
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const { data: orders, error } = await supabase
      .from("orders")
      .select("total_amount, created_at, order_items(quantity)")
      .in("payment_status", ["success", "paid"])
      .gte("created_at", twelveMonthsAgo.toISOString())

    if (error) throw error

    // Group by month
    const monthlyData = new Map()
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Initialize all months with 0
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      monthlyData.set(monthKey, {
        month: months[date.getMonth()],
        avgSale: 0,
        avgItem: 0,
        orderCount: 0,
        itemCount: 0,
      })
    }

    // Aggregate data
    orders?.forEach((order) => {
      const date = new Date(order.created_at)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      const data = monthlyData.get(monthKey)

      if (data) {
        data.avgSale += Number(order.total_amount || 0)
        data.orderCount += 1
        data.itemCount += order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0
      }
    })

    // Calculate averages
    const chartData = Array.from(monthlyData.values()).map((data) => ({
      month: data.month,
      avgSale: data.orderCount > 0 ? Math.round(data.avgSale / data.orderCount) : 0,
      avgItem: data.orderCount > 0 ? Math.round(data.itemCount / data.orderCount) : 0,
    }))

    // Calculate totals
    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
    const totalItems =
      orders?.reduce(
        (sum, order) => sum + (order.order_items?.reduce((s: number, item: any) => s + (item.quantity || 0), 0) || 0),
        0,
      ) || 0

    return NextResponse.json({
      chartData,
      totalRevenue,
      totalItems,
      avgOrderValue: orders && orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
    })
  } catch (error) {
    console.error("[v0] Sales chart error:", error)
    return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 })
  }
}
