import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { verifyDisbursement } from "@/lib/korapay"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Admin auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: userData } = await supabase
      .from("users").select("is_admin, role").eq("auth_id", user.id).single()
    if (!userData?.is_admin && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Fetch the withdrawal to get the KoraPay reference
    const { data: withdrawal, error: fetchError } = await adminClient
      .from("withdrawal_requests")
      .select("id, status, kora_payout_reference, kora_payout_status, payout_gateway")
      .eq("id", id)
      .single()

    if (fetchError || !withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 })
    }

    if (!withdrawal.kora_payout_reference) {
      return NextResponse.json({ error: "No KoraPay payout reference on this withdrawal" }, { status: 400 })
    }

    // Ask KoraPay for the latest status
    const koraRes = await verifyDisbursement(withdrawal.kora_payout_reference)

    if (!koraRes.status) {
      return NextResponse.json({ error: `KoraPay error: ${koraRes.message}` }, { status: 400 })
    }

    const koraStatus: string = koraRes.data?.status ?? "unknown"

    // Map KoraPay status → withdrawal_requests status
    const newStatus =
      koraStatus === "success" ? "approved" :
      koraStatus === "failed"  ? "rejected" :
      withdrawal.status  // leave unchanged if still processing

    // Sync DB if the KoraPay status changed
    if (koraStatus !== withdrawal.kora_payout_status || newStatus !== withdrawal.status) {
      await adminClient
        .from("withdrawal_requests")
        .update({
          kora_payout_status: koraStatus,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
    }

    return NextResponse.json({
      withdrawal_id: id,
      kora_reference: withdrawal.kora_payout_reference,
      kora_status: koraStatus,
      kora_message: koraRes.data?.message ?? null,
      withdrawal_status: newStatus,
      amount: koraRes.data?.amount,
      completion_date: koraRes.data?.completion_date ?? null,
    })
  } catch (error) {
    console.error("[korapay/payout-status] Error:", error)
    return NextResponse.json({ error: "Failed to check payout status" }, { status: 500 })
  }
}
