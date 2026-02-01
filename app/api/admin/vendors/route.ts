import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const adminClient = createAdminClient()

    const { data: vendors, error: vendorsError } = await adminClient
      .from("users")
      .select("id, full_name, business_name, email, phone, created_at")
      .eq("role", "vendor")
      .order("created_at", { ascending: false })

    if (vendorsError) throw vendorsError

    const vendorsWithStats = await Promise.all(
      (vendors || []).map(async (vendor) => {
        const { count: productCount } = await adminClient
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", vendor.id)

        const { count: orderCount } = await adminClient
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", vendor.id)

        const { data: orders } = await adminClient
          .from("orders")
          .select("total_amount")
          .eq("user_id", vendor.id)
          .eq("payment_status", "paid")

        const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0

        return {
          ...vendor,
          total_products: productCount || 0,
          total_orders: orderCount || 0,
          total_revenue: totalRevenue,
        }
      }),
    )

    return NextResponse.json({ vendors: vendorsWithStats })
  } catch (error) {
    console.error("[v0] Admin vendors API error:", error)
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 })
  }
}
