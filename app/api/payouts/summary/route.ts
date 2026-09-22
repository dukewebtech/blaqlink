import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Was previously computed client-side by the Payouts page from the full
// output of GET /api/orders (every order, with nested order_items, for the
// vendor's entire history) — just to sum three numbers. Fetches only the
// three columns this needs and does the same net-of-fees math here instead.
export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("payment_status, total_amount, platform_fee_amount")
      .eq("user_id", userProfile.id)

    if (error) {
      console.error("[v0] Payouts summary fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: settings } = await supabase.from("platform_settings").select("commission_percentage").single()
    // Orders created before per-plan fees existed have no platform_fee_amount —
    // fall back to the flat commission for those so historical totals don't shift.
    const fallbackCommissionRate = settings?.commission_percentage || 10

    const paidOrders = (orders ?? []).filter((o) => o.payment_status === "paid" || o.payment_status === "success")

    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    const totalFees = paidOrders.reduce((sum, o) => {
      const fee = o.platform_fee_amount ?? (Number(o.total_amount || 0) * fallbackCommissionRate) / 100
      return sum + Number(fee)
    }, 0)

    return NextResponse.json({ totalRevenue, totalFees, netRevenue: totalRevenue - totalFees })
  } catch (error) {
    console.error("[v0] Payouts summary API error:", error)
    return NextResponse.json({ error: "Failed to fetch payouts summary" }, { status: 500 })
  }
}
