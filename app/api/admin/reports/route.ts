import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Get total revenue
    const { data: orders } = await adminClient.from("orders").select("total_amount").eq("payment_status", "paid")

    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0

    // Get total orders
    const { count: totalOrders } = await adminClient.from("orders").select("*", { count: "exact", head: true })

    // Get total vendors
    const { count: totalVendors } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "vendor")

    // Get total products
    const { count: totalProducts } = await adminClient.from("products").select("*", { count: "exact", head: true })

    // Get top vendors by revenue
    const { data: vendors } = await adminClient
      .from("users")
      .select("id, full_name, business_name")
      .eq("role", "vendor")

    const vendorsWithRevenue = await Promise.all(
      (vendors || []).map(async (vendor) => {
        const { data: vendorOrders } = await adminClient
          .from("orders")
          .select("total_amount")
          .eq("user_id", vendor.id)
          .eq("payment_status", "paid")

        const revenue = vendorOrders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0

        return {
          name: vendor.business_name || vendor.full_name,
          revenue,
        }
      }),
    )

    const topVendors = vendorsWithRevenue.sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    return NextResponse.json({
      totalRevenue,
      totalOrders: totalOrders || 0,
      totalVendors: totalVendors || 0,
      totalProducts: totalProducts || 0,
      revenueGrowth: 12.5, // Mock data - calculate from previous month
      ordersGrowth: 8.3, // Mock data - calculate from previous month
      topVendors,
    })
  } catch (error) {
    console.error("[v0] Admin reports API error:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
