import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Fetching admin reports...")
    const adminClient = createAdminClient()

    // Orders created before the per-plan fee snapshot was introduced have no
    // platform_fee_amount — fall back to the old flat commission for those
    // so historical totals never shift.
    let fallbackCommissionPercentage = 10
    try {
      const { data: settings, error: settingsError } = await adminClient.from("platform_settings").select("*").single()

      if (!settingsError && settings) {
        fallbackCommissionPercentage = settings.commission_percentage || 10
      }
    } catch (settingsErr) {
      console.log("[v0] Platform settings table not found, using default fallback commission (10%)")
    }

    const feeForOrder = (order: { total_amount: number; platform_fee_amount: number | null }) =>
      order.platform_fee_amount ?? (Number(order.total_amount || 0) * fallbackCommissionPercentage) / 100

    // Get all paid orders
    const { data: orders } = await adminClient
      .from("orders")
      .select("total_amount, user_id, platform_fee_amount")
      .in("payment_status", ["paid", "success"])

    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
    const totalCommission = orders?.reduce((sum, order) => sum + feeForOrder(order), 0) || 0
    const netRevenue = totalRevenue - totalCommission
    const commissionPercentage = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0

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
          .select("total_amount, platform_fee_amount")
          .eq("user_id", vendor.id)
          .in("payment_status", ["paid", "success"])

        const grossRevenue = vendorOrders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
        const vendorCommission = vendorOrders?.reduce((sum, order) => sum + feeForOrder(order), 0) || 0
        const netRevenue = grossRevenue - vendorCommission

        return {
          name: vendor.business_name || vendor.full_name,
          grossRevenue,
          netRevenue,
          commission: vendorCommission,
          commissionPercentage: grossRevenue > 0 ? (vendorCommission / grossRevenue) * 100 : 0,
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
