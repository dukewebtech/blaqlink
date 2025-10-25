import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Admin stats: User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userData?.is_admin) {
      console.log("[v0] Admin stats: User is not admin")
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Fetch platform-wide statistics
    const [usersResult, ordersResult, productsResult, withdrawalsResult] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total_amount, payment_status"),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("withdrawal_requests").select("amount, status"),
    ])

    const totalUsers = usersResult.count || 0
    const totalProducts = productsResult.count || 0

    // Calculate revenue from successful orders
    const successfulOrders =
      ordersResult.data?.filter((order) => order.payment_status === "success" || order.payment_status === "paid") || []
    const totalRevenue = successfulOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const totalOrders = successfulOrders.length

    // Calculate withdrawal statistics
    const pendingWithdrawals = withdrawalsResult.data?.filter((w) => w.status === "pending") || []
    const approvedWithdrawals = withdrawalsResult.data?.filter((w) => w.status === "approved") || []

    const totalPendingWithdrawals = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0)
    const totalApprovedWithdrawals = approvedWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0)

    console.log("[v0] Admin stats fetched successfully")

    return NextResponse.json({
      totalUsers,
      totalProducts,
      totalRevenue,
      totalOrders,
      pendingWithdrawalsCount: pendingWithdrawals.length,
      totalPendingWithdrawals,
      totalApprovedWithdrawals,
    })
  } catch (error) {
    console.error("[v0] Error fetching admin stats:", error)
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 })
  }
}
