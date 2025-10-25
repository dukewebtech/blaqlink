import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Fetching sales analytics...")
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all successful orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        total_amount,
        payment_status,
        created_at,
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
      .in("payment_status", ["success", "paid"])
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("[v0] Error fetching orders:", ordersError)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Calculate analytics
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0)
    const totalOrders = orders.length
    const totalItemsSold = orders.reduce(
      (sum, order) => sum + order.order_items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0),
      0,
    )

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Group sales by month
    const salesByMonth: { [key: string]: number } = {}
    const ordersByMonth: { [key: string]: number } = {}

    orders.forEach((order) => {
      const date = new Date(order.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + Number(order.total_amount)
      ordersByMonth[monthKey] = (ordersByMonth[monthKey] || 0) + 1
    })

    // Convert to array format for charts
    const monthlySales = Object.entries(salesByMonth)
      .map(([month, revenue]) => ({
        month,
        revenue,
        orders: ordersByMonth[month],
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months

    // Calculate top products
    const productSales: { [key: string]: { title: string; quantity: number; revenue: number } } = {}

    orders.forEach((order) => {
      order.order_items.forEach((item: any) => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            title: item.product_title,
            quantity: 0,
            revenue: 0,
          }
        }
        productSales[item.product_id].quantity += item.quantity
        productSales[item.product_id].revenue += Number(item.subtotal)
      })
    })

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({
        id,
        ...data,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Calculate sales by product type
    const salesByType: { [key: string]: { count: number; revenue: number } } = {}

    orders.forEach((order) => {
      order.order_items.forEach((item: any) => {
        const type = item.product_type || "other"
        if (!salesByType[type]) {
          salesByType[type] = { count: 0, revenue: 0 }
        }
        salesByType[type].count += item.quantity
        salesByType[type].revenue += Number(item.subtotal)
      })
    })

    // Calculate recent performance (last 7 days vs previous 7 days)
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const recentOrders = orders.filter((order) => new Date(order.created_at) >= last7Days)
    const previousOrders = orders.filter(
      (order) => new Date(order.created_at) >= previous7Days && new Date(order.created_at) < last7Days,
    )

    const recentRevenue = recentOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)

    const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const ordersGrowth =
      previousOrders.length > 0 ? ((recentOrders.length - previousOrders.length) / previousOrders.length) * 100 : 0

    console.log("[v0] Sales analytics calculated successfully")

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders,
        totalItemsSold,
        averageOrderValue,
        revenueGrowth,
        ordersGrowth,
      },
      monthlySales,
      topProducts,
      salesByType,
    })
  } catch (error) {
    console.error("[v0] Error in sales analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
