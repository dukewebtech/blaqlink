import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"
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

    const body = await request.json().catch(() => null)
    const amount = Number(body?.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Verification, saved bank account, minimum and available balance are
    // all checked inside one locked transaction (request_withdrawal), so two
    // requests at once can't both pass. Bank details always come from the
    // verified profile, never from the request.
    const { data: result, error } = await adminClient.rpc("request_withdrawal", {
      p_user: authResult.user.userId,
      p_amount: Math.round(amount * 100) / 100,
    })
    if (error) {
      console.error("[withdrawals] request_withdrawal failed:", error.message)
      return NextResponse.json({ error: "We couldn't create your withdrawal. Please try again." }, { status: 500 })
    }
    if (!result?.ok) {
      const status = result?.code === "not_verified" ? 403 : 400
      return NextResponse.json({ error: result?.message ?? "We couldn't create your withdrawal.", code: result?.code }, { status })
    }

    const withdrawal = result.withdrawal

    const { data: settings } = await adminClient.from("platform_settings").select("auto_withdrawal_enabled").maybeSingle()
    if (settings?.auto_withdrawal_enabled) {
      const bankCode = getBankCode(withdrawal.bank_name)
      if (!bankCode) {
        console.warn("[auto-disburse] Unknown bank code for:", withdrawal.bank_name)
        return NextResponse.json({ ok: true, withdrawal, warning: "We'll process this withdrawal manually." })
      }

      const payoutRef = `PAY-${withdrawal.id.slice(0, 8).toUpperCase()}-${Date.now()}`
      try {
        const koraResult = await initializeDisbursement({
          reference: payoutRef,
          amount: Number(withdrawal.amount),
          bankCode,
          accountNumber: withdrawal.account_number,
          accountName: withdrawal.account_name,
          narration: "Blaqora vendor payout",
          customerEmail: authResult.user.email,
        })

        if (koraResult.status) {
          await adminClient
            .from("withdrawal_requests")
            .update({
              status: "approved",
              payout_gateway: "korapay",
              kora_payout_reference: payoutRef,
              kora_payout_status: koraResult.data?.status ?? "processing",
            })
            .eq("id", withdrawal.id)
          return NextResponse.json({ ok: true, withdrawal: { ...withdrawal, status: "approved" }, auto_disbursed: true })
        }
        console.warn("[auto-disburse] Korapay rejected disbursement:", koraResult.message)
      } catch (koraErr) {
        console.error("[auto-disburse] Korapay call failed:", koraErr)
      }
    }

    return NextResponse.json({ ok: true, withdrawal })
  } catch (error) {
    return handleApiError(error, "POST /api/withdrawals")
  }
}
