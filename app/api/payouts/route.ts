import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Fetching payout data...")
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth check - User:", user ? "Found" : "Not found")
    console.log("[v0] Auth check - Error:", authError ? authError.message : "None")

    if (authError || !user) {
      console.error("[v0] Auth error in payouts:", authError?.message || "No user session")
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Please log in to access payout data",
        },
        { status: 401 },
      )
    }

    console.log("[v0] Auth user ID:", user.id)

    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("id, business_name")
      .eq("auth_id", user.id)
      .maybeSingle()

    if (userError || !userProfile) {
      console.error("[v0] Error fetching user profile:", userError)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const storeName = userProfile.business_name || "Your Store"
    const userId = userProfile.id

    console.log("[v0] Store name:", storeName)
    console.log("[v0] User record ID:", userId)

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("total_amount")
      .in("payment_status", ["success", "paid"])

    if (ordersError) {
      console.error("[v0] Error fetching orders:", ordersError)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Calculate total revenue from orders
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0)
    console.log("[v0] Total revenue calculated:", totalRevenue)

    const { data: withdrawalRequests, error: withdrawalsError } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (withdrawalsError) {
      console.error("[v0] Error fetching withdrawal requests:", withdrawalsError)
      return NextResponse.json({ error: "Failed to fetch withdrawal requests" }, { status: 500 })
    }

    console.log("[v0] Withdrawal requests fetched:", withdrawalRequests?.length || 0)

    const totalWithdrawals =
      withdrawalRequests?.filter((w) => w.status === "approved").reduce((sum, w) => sum + Number(w.amount), 0) || 0

    const pendingWithdrawals =
      withdrawalRequests?.filter((w) => w.status === "pending").reduce((sum, w) => sum + Number(w.amount), 0) || 0

    const availableBalance = totalRevenue - totalWithdrawals

    const withdrawalHistory =
      withdrawalRequests?.map((request) => ({
        id: request.id.substring(0, 10),
        storeName: storeName,
        amount: Number(request.amount),
        date: request.created_at,
        status: request.status,
        bankName: request.bank_name,
        accountNumber: request.account_number,
        accountName: request.account_name,
      })) || []

    console.log("[v0] Payout data calculated successfully")
    console.log("[v0] Summary:", {
      totalRevenue,
      availableBalance,
      totalWithdrawals,
      pendingWithdrawals,
      withdrawalRequestsCount: withdrawalRequests?.length || 0,
    })

    return NextResponse.json({
      ok: true,
      data: {
        totalRevenue,
        availableBalance,
        totalWithdrawals,
        pendingWithdrawals,
        withdrawalHistory,
      },
    })
  } catch (error) {
    console.error("[v0] Error in payouts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
