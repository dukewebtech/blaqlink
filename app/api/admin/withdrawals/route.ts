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

    // Fetch all pending withdrawals with user details
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from("withdrawal_requests")
      .select(
        `
        *,
        users!inner (
          full_name,
          email,
          business_name
        )
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (withdrawalsError) {
      console.error("[v0] Withdrawals fetch error:", withdrawalsError)
      return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    // Transform the data to flatten the user object
    const transformedWithdrawals = withdrawals?.map((w: any) => ({
      ...w,
      user: w.users,
      users: undefined,
    }))

    return NextResponse.json({ data: transformedWithdrawals })
  } catch (error) {
    console.error("[v0] Admin withdrawals error:", error)
    return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
  }
}
