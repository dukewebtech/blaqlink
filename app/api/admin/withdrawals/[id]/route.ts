import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, getWithdrawalUpdateEmailForVendor } from "@/lib/email"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin access
    const { data: userData } = await supabase.from("users").select("is_admin, role").eq("auth_id", user.id).single()

    if (!userData?.is_admin && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { status, admin_notes } = await request.json()

    // Use admin client to update withdrawal status
    const adminClient = createAdminClient()

    const { data: withdrawal } = await adminClient
      .from("withdrawal_requests")
      .select("*, users:user_id(email, full_name, business_name)")
      .eq("id", params.id)
      .single()

    const { data, error } = await adminClient
      .from("withdrawal_requests")
      .update({
        status,
        admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to update withdrawal:", error)
      return NextResponse.json({ error: "Failed to update withdrawal" }, { status: 500 })
    }

    if (withdrawal?.users?.email && (status === "approved" || status === "rejected")) {
      const vendorEmail = getWithdrawalUpdateEmailForVendor({
        vendorName: withdrawal.users.full_name || withdrawal.users.business_name || "Vendor",
        amount: withdrawal.amount,
        status: status as "approved" | "rejected",
        bankName: withdrawal.bank_name,
        accountNumber: withdrawal.account_number,
        adminNotes: admin_notes,
      })

      sendEmail({
        to: withdrawal.users.email,
        subject: vendorEmail.subject,
        html: vendorEmail.html,
      }).catch((err) => console.error("[v0] Failed to send withdrawal email:", err))
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Withdrawal update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
