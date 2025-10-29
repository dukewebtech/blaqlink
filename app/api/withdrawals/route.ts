import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle()

    if (profileError || !userProfile) {
      console.error("[v0] Error fetching user profile:", profileError)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Fetch user's withdrawal requests using the users table id
    const { data: withdrawals, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("user_id", userProfile.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching withdrawals:", error)
      return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, withdrawals })
  } catch (error) {
    console.error("[v0] Withdrawals API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle()

    if (profileError || !userProfile) {
      console.error("[v0] Error fetching user profile:", profileError)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { amount, bank_name, account_number, account_name } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!bank_name || !account_number || !account_name) {
      return NextResponse.json(
        { error: "Please provide bank details (bank name, account number, and account name)" },
        { status: 400 },
      )
    }

    const adminClient = await createAdminClient()

    const { data: withdrawal, error: insertError } = await adminClient
      .from("withdrawal_requests")
      .insert({
        user_id: userProfile.id,
        amount,
        bank_name,
        account_number,
        account_name,
        status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating withdrawal request:", insertError.message)
      return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, withdrawal })
  } catch (error) {
    console.error("[v0] Withdrawal request API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
