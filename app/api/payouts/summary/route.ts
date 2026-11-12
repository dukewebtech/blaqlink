import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/utils/api-helpers"
import { getAvailableBalance } from "@/lib/payouts"

// Everything the Payouts page shows, worked out on the server. "available"
// comes from the same database function the withdrawal lock uses.
export async function GET() {
  const auth = await getAuthenticatedUser()
  if (!auth.success) return auth.error

  try {
    const supabase = createAdminClient()
    const vendorId = auth.user.userId

    const [available, { data: orders }, { data: withdrawals }, { data: vendor }, { data: settings }] = await Promise.all([
      getAvailableBalance(vendorId),
      supabase.from("orders").select("payment_status, total_amount, platform_fee_amount").eq("user_id", vendorId),
      supabase.from("withdrawal_requests").select("amount, status").eq("user_id", vendorId),
      supabase.from("users").select("payout_verified, bank_name, account_number, account_name").eq("id", vendorId).single(),
      supabase.from("platform_settings").select("minimum_withdrawal_amount").maybeSingle(),
    ])

    const paid = (orders ?? []).filter((o) => o.payment_status === "success")
    const earned = paid.reduce((sum, o) => sum + Number(o.total_amount) - Number(o.platform_fee_amount ?? 0), 0)
    const sumWhere = (statuses: string[]) =>
      (withdrawals ?? []).filter((w) => statuses.includes(w.status)).reduce((sum, w) => sum + Number(w.amount), 0)

    return NextResponse.json({
      earned: Math.round(earned * 100) / 100,
      available,
      withdrawn: sumWhere(["approved", "completed"]),
      pending: sumWhere(["pending"]),
      minimum: Number(settings?.minimum_withdrawal_amount ?? 5000),
      verified: !!vendor?.payout_verified,
      bank: vendor?.bank_name && vendor.account_number && vendor.account_name
        ? { bank_name: vendor.bank_name, account_number_last4: vendor.account_number.slice(-4), account_name: vendor.account_name }
        : null,
    })
  } catch (error) {
    console.error("[payouts/summary] failed:", error)
    return NextResponse.json({ error: "We couldn't load your balance. Please refresh." }, { status: 500 })
  }
}
