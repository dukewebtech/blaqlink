import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const adminClient = createAdminClient()

    const { data: withdrawals, error: withdrawalsError } = await adminClient
      .from("withdrawal_requests")
      .select(
        `
        id,
        amount,
        status,
        bank_name,
        account_number,
        account_name,
        created_at,
        user_id,
        users!inner (
          full_name,
          email,
          business_name
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (withdrawalsError) {
      console.error("[v0] Withdrawals fetch error:", withdrawalsError)
      return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    const formattedWithdrawals = withdrawals?.map((w: any) => ({
      id: w.id,
      amount: w.amount,
      status: w.status,
      bank_name: w.bank_name,
      account_number: w.account_number,
      account_name: w.account_name,
      created_at: w.created_at,
      vendor_name: w.users?.full_name || "Unknown",
      vendor_business: w.users?.business_name || "Unknown",
      vendor_email: w.users?.email || "Unknown",
    }))

    return NextResponse.json({ withdrawals: formattedWithdrawals || [] })
  } catch (error) {
    console.error("[v0] Admin withdrawals error:", error)
    return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
  }
}
