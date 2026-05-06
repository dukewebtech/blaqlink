import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, getWithdrawalUpdateEmailForVendor } from "@/lib/email"
import { initializeDisbursement, getBankCode } from "@/lib/korapay"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("is_admin, role")
      .eq("auth_id", user.id)
      .single()

    if (!userData?.is_admin && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { status, admin_notes } = await request.json()
    const adminClient = createAdminClient()

    // Fetch full withdrawal record before update
    const { data: withdrawal } = await adminClient
      .from("withdrawal_requests")
      .select("*, users:user_id(email, full_name, business_name)")
      .eq("id", id)
      .single()

    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 })
    }

    // ── Auto-disburse via KoraPay when admin approves ────────────────────────
    if (status === "approved") {
      const bankCode = getBankCode(withdrawal.bank_name ?? "")

      if (!bankCode) {
        // Bank not mappable — let admin know but don't hard-block; they can handle manually
        console.warn("[korapay/disburse] Unknown bank code for:", withdrawal.bank_name)
        return NextResponse.json(
          {
            error: `Cannot auto-disburse: bank "${withdrawal.bank_name}" is not mapped to a KoraPay bank code. ` +
              `Please disburse manually or contact support to add this bank.`,
          },
          { status: 422 },
        )
      }

      const payoutRef = `PAY-${id.slice(0, 8).toUpperCase()}-${Date.now()}`

      console.log("[korapay/disburse] Initiating disbursement:", { payoutRef, amount: withdrawal.amount })

      let koraResult: any
      try {
        koraResult = await initializeDisbursement({
          reference: payoutRef,
          amount: withdrawal.amount,
          bankCode,
          accountNumber: withdrawal.account_number,
          accountName: withdrawal.account_name,
          narration: `Blaqora vendor payout – ${withdrawal.users?.business_name || withdrawal.users?.full_name || "Vendor"}`,
          customerEmail: withdrawal.users?.email,
        })
      } catch (koraErr) {
        console.error("[korapay/disburse] API call failed:", koraErr)
        return NextResponse.json({ error: "KoraPay disbursement API call failed. Try again." }, { status: 502 })
      }

      console.log("[korapay/disburse] Response:", koraResult.status, koraResult.message)

      if (!koraResult.status) {
        return NextResponse.json(
          { error: `KoraPay disbursement failed: ${koraResult.message || "unknown error"}` },
          { status: 400 },
        )
      }

      // KoraPay accepted — mark as "approved". kora_payout_status tracks the
      // KoraPay-level state (processing → success/failed via webhook).
      const koraStatus = koraResult.data?.status ?? "processing"

      const { data, error } = await adminClient
        .from("withdrawal_requests")
        .update({
          status: "approved",
          admin_notes: admin_notes ?? null,
          payout_gateway: "korapay",
          kora_payout_reference: payoutRef,
          kora_payout_status: koraStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("[korapay/disburse] DB update error:", error)
        return NextResponse.json({ error: "Failed to update withdrawal after disbursement" }, { status: 500 })
      }

      // Send email — use "approved" wording for vendor regardless of processing state
      if (withdrawal.users?.email) {
        const emailPayload = getWithdrawalUpdateEmailForVendor({
          vendorName: withdrawal.users.full_name || withdrawal.users.business_name || "Vendor",
          amount: withdrawal.amount,
          status: "approved",
          bankName: withdrawal.bank_name,
          accountNumber: withdrawal.account_number,
          withdrawalId: id,
          adminNote: admin_notes,
        })
        sendEmail({ to: withdrawal.users.email, subject: emailPayload.subject, html: emailPayload.html })
          .catch((err) => console.error("[korapay/disburse] Email error:", err))
      }

      return NextResponse.json({ data, kora_payout_reference: payoutRef, kora_status: koraStatus })
    }

    // ── Manual rejection (no KoraPay call) ──────────────────────────────────
    const { data, error } = await adminClient
      .from("withdrawal_requests")
      .update({
        status,
        admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to update withdrawal:", error)
      return NextResponse.json({ error: "Failed to update withdrawal" }, { status: 500 })
    }

    if (withdrawal.users?.email && status === "rejected") {
      const emailPayload = getWithdrawalUpdateEmailForVendor({
        vendorName: withdrawal.users.full_name || withdrawal.users.business_name || "Vendor",
        amount: withdrawal.amount,
        status: "rejected",
        bankName: withdrawal.bank_name,
        accountNumber: withdrawal.account_number,
        withdrawalId: id,
        adminNote: admin_notes,
      })
      sendEmail({ to: withdrawal.users.email, subject: emailPayload.subject, html: emailPayload.html })
        .catch((err) => console.error("[v0] Email error:", err))
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Withdrawal update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
