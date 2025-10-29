import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Fetching admin reports...")
    const adminClient = createAdminClient()

    let commissionPercentage = 10 // Default fallback
    try {
      const { data: settings, error: settingsError } = await adminClient.from("platform_settings").select("*").single()

      if (!settingsError && settings) {
        commissionPercentage = settings.commission_percentage || 10
      }
    } catch (settingsErr) {
      // Table doesn't exist yet, use default value
      console.log("[v0] Platform settings table not found, using default commission (10%)")
    }

    console.log("[v0] Commission percentage:", commissionPercentage)

    // Get all paid orders
    const { data: orders } = await adminClient
      .from("orders")
      .select("total_amount, user_id")
      .in("payment_status", ["paid", "success"])

    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0

    const totalCommission = (totalRevenue * commissionPercentage) / 100
    const netRevenue = totalRevenue - totalCommission

    console.log("[v0] Revenue breakdown:", {
      totalRevenue,
      commissionPercentage,
      totalCommission,
      netRevenue,
    })

    // Get total orders
    const { count: totalOrders } = await adminClient.from("orders").select("*", { count: "exact", head: true })

    // Get total vendors
    const { count: totalVendors } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "vendor")

    // Get total products
    const { count: totalProducts } = await adminClient.from("products").select("*", { count: "exact", head: true })

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
          .in("payment_status", ["paid", "success"])

        const grossRevenue = vendorOrders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
        const vendorCommission = (grossRevenue * commissionPercentage) / 100
        const netRevenue = grossRevenue - vendorCommission

        return {
          name: vendor.business_name || vendor.full_name,
          grossRevenue,
          netRevenue,
          commission: vendorCommission,
        }
      }),
    )

    const topVendors = vendorsWithRevenue.sort((a, b) => b.grossRevenue - a.grossRevenue).slice(0, 5)

    console.log("[v0] Top vendors:", topVendors)

    return NextResponse.json({
      totalRevenue,
      totalCommission,
      netRevenue,
      commissionPercentage,
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
