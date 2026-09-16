import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { sendEmail, getSystemUpdateEmail } from "@/lib/email"

// Vendors can't self-assign a paid plan (no billing collection yet) — this
// notifies admins, who assign the plan from /admin/vendors once payment is confirmed.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { requested_plan_id } = await request.json()
    if (!requested_plan_id) {
      return NextResponse.json({ error: "requested_plan_id is required" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: vendor } = await adminClient
      .from("users")
      .select("id, full_name, business_name, email")
      .eq("auth_id", user.id)
      .single()

    const { data: requestedPlan } = await adminClient
      .from("pricing_plans")
      .select("name")
      .eq("id", requested_plan_id)
      .maybeSingle()

    if (!vendor || !requestedPlan) {
      return NextResponse.json({ error: "Vendor or plan not found" }, { status: 404 })
    }

    const { data: admins } = await adminClient.from("users").select("email").eq("is_admin", true)

    const email = getSystemUpdateEmail({
      title: "Plan Upgrade Request",
      message: `${vendor.business_name || vendor.full_name} (${vendor.email}) has requested to move to the ${requestedPlan.name} plan.\n\nAssign it from the Vendors page once payment is confirmed.`,
      ctaText: "Open Vendors",
      ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://blaqora.store"}/admin/vendors`,
    })

    await Promise.all(
      (admins || [])
        .filter((admin) => admin.email)
        .map((admin) => sendEmail({ to: admin.email, subject: email.subject, html: email.html })),
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Plan upgrade request error:", error)
    return NextResponse.json({ error: "Failed to send upgrade request" }, { status: 500 })
  }
}
