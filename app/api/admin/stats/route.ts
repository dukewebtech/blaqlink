import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify admin access
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check admin status
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin, role")
      .eq("auth_id", authUser.id)
      .maybeSingle()

    if (userError || !userData || (!userData.is_admin && userData.role !== "admin")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Fetch admin stats
    const [vendorsResult, ordersResult, withdrawalsResult] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total_amount", { count: "exact" }),
      supabase.from("withdrawal_requests").select("amount, status").eq("status", "pending"),
    ])

    const totalVendors = vendorsResult.count || 0
    const totalOrders = ordersResult.count || 0
    const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
    const pendingWithdrawals = withdrawalsResult.data?.length || 0
    const pendingWithdrawalAmount = withdrawalsResult.data?.reduce((sum, w) => sum + Number(w.amount), 0) || 0

    return NextResponse.json({
      data: {
        totalVendors,
        totalOrders,
        totalRevenue,
        pendingWithdrawals,
        pendingWithdrawalAmount,
      },
    })
  } catch (error) {
    console.error("[v0] Admin stats error:", error)
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 })
  }
}
