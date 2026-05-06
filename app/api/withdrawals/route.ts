import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"
import { validateBody, withdrawalSchema } from "@/lib/utils/validation"
import { getBankCode, initializeDisbursement } from "@/lib/korapay"

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
    let autoWithdrawalEnabled = false
    try {
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("minimum_withdrawal_amount, auto_withdrawal_enabled")
        .single()
      minWithdrawal = settings?.minimum_withdrawal_amount || 5000
      autoWithdrawalEnabled = settings?.auto_withdrawal_enabled ?? false
    } catch (error) {
      console.log("[v0] Platform settings not available, using defaults")
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

    // Auto-disburse immediately if the admin has enabled automatic withdrawals
    if (autoWithdrawalEnabled) {
      const bankCode = getBankCode(bank_name)

      if (!bankCode) {
        console.warn("[auto-disburse] Unknown bank code for:", bank_name)
        return NextResponse.json({
          ok: true,
          withdrawal,
          warning: `Auto-disbursement skipped: bank "${bank_name}" is not mapped. An admin will process this manually.`,
        })
      }

      const payoutRef = `PAY-${withdrawal.id.slice(0, 8).toUpperCase()}-${Date.now()}`

      try {
        const koraResult = await initializeDisbursement({
          reference: payoutRef,
          amount,
          bankCode,
          accountNumber: account_number,
          accountName: account_name,
          narration: `Blaqora vendor payout`,
          customerEmail: authResult.user.email,
        })

        if (koraResult.status) {
          const koraStatus = koraResult.data?.status ?? "processing"
          await adminClient
            .from("withdrawal_requests")
            .update({
              status: "approved",
              payout_gateway: "korapay",
              kora_payout_reference: payoutRef,
              kora_payout_status: koraStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", withdrawal.id)

          console.log("[auto-disburse] Disbursement initiated:", payoutRef)
          return NextResponse.json({ ok: true, withdrawal: { ...withdrawal, status: "approved" }, auto_disbursed: true })
        } else {
          console.warn("[auto-disburse] KoraPay rejected disbursement:", koraResult.message)
        }
      } catch (koraErr) {
        console.error("[auto-disburse] KoraPay call failed:", koraErr)
      }
    }

    return NextResponse.json({ ok: true, withdrawal })
  } catch (error) {
    return handleApiError(error, "POST /api/withdrawals")
  }
}
