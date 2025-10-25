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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Fetch all withdrawal requests with user information
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from("withdrawal_requests")
      .select(`
        *,
        users!inner (
          id,
          full_name,
          business_name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (withdrawalsError) {
      console.error("[v0] Error fetching withdrawals:", withdrawalsError)
      return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    console.log("[v0] Admin withdrawals fetched:", withdrawals?.length || 0)

    return NextResponse.json({ withdrawals: withdrawals || [] })
  } catch (error) {
    console.error("[v0] Error in admin withdrawals API:", error)
    return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, admin_notes } = body

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update withdrawal request
    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from("withdrawal_requests")
      .update({
        status,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating withdrawal:", updateError)
      return NextResponse.json({ error: "Failed to update withdrawal" }, { status: 500 })
    }

    console.log("[v0] Withdrawal updated:", id, "status:", status)

    return NextResponse.json({ withdrawal: updatedWithdrawal })
  } catch (error) {
    console.error("[v0] Error in admin withdrawal update:", error)
    return NextResponse.json({ error: "Failed to update withdrawal" }, { status: 500 })
  }
}
