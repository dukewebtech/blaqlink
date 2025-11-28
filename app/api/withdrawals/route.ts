import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"
import { validateBody, withdrawalSchema } from "@/lib/utils/validation"

export async function GET() {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) {
      return authResult.error
    }

    const supabase = await createClient()

    const { data: withdrawals, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("user_id", authResult.user.userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching withdrawals:", error)
      return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, withdrawals })
  } catch (error) {
    return handleApiError(error, "GET /api/withdrawals")
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) {
      return authResult.error
    }

    const body = await request.json()

    const validation = validateBody(withdrawalSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { amount, bank_name, account_number, account_name } = validation.data

    const supabase = await createClient()

    let minWithdrawal = 5000
    try {
      const { data: settings } = await supabase.from("platform_settings").select("minimum_withdrawal_amount").single()
      minWithdrawal = settings?.minimum_withdrawal_amount || 5000
    } catch (error) {
      console.log("[v0] Platform settings not available, using default minimum withdrawal")
    }

    if (amount < minWithdrawal) {
      console.log("[v0] Withdrawal amount below minimum:", { amount, minWithdrawal })
      return NextResponse.json(
        { error: `Minimum withdrawal amount is NGN ${minWithdrawal.toLocaleString()}` },
        { status: 400 },
      )
    }

    const adminClient = createAdminClient()

    const { data: withdrawal, error: insertError } = await adminClient
      .from("withdrawal_requests")
      .insert({
        user_id: authResult.user.userId,
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

    console.log("[v0] Withdrawal request created successfully:", withdrawal.id)
    return NextResponse.json({ ok: true, withdrawal })
  } catch (error) {
    return handleApiError(error, "POST /api/withdrawals")
  }
}
