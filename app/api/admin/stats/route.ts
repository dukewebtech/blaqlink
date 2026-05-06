import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const [usersResult, productsResult, ordersResult, pendingWithdrawalsResult, approvedWithdrawalsResult] =
      await Promise.all([
        // Total users count
        supabase
          .from("users")
          .select("id", { count: "exact", head: true }),
        // Total products count
        supabase
          .from("products")
          .select("id", { count: "exact", head: true }),
        // Total orders and revenue
        supabase
          .from("orders")
          .select("total_amount", { count: "exact" }),
        // Pending withdrawals
        supabase
          .from("withdrawal_requests")
          .select("amount")
          .eq("status", "pending"),
        // Approved withdrawals
        supabase
          .from("withdrawal_requests")
          .select("amount")
          .eq("status", "approved"),
      ])

    const totalUsers = usersResult.count || 0
    const totalProducts = productsResult.count || 0
    const totalOrders = ordersResult.count || 0
    const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
    const pendingWithdrawalsCount = pendingWithdrawalsResult.data?.length || 0
    const totalPendingWithdrawals =
      pendingWithdrawalsResult.data?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0
    const totalApprovedWithdrawals =
      approvedWithdrawalsResult.data?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0

    console.log("[v0] Admin stats calculated:", {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingWithdrawalsCount,
      totalPendingWithdrawals,
      totalApprovedWithdrawals,
    })

    return NextResponse.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingWithdrawalsCount,
      totalPendingWithdrawals,
      totalApprovedWithdrawals,
    })
  } catch (error) {
    console.error("[v0] Admin stats error:", error)
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 })
  }
}
