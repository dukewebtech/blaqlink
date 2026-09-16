import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("users").select("is_admin").eq("auth_id", user.id).maybeSingle()
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { plan_id } = await request.json()
    if (!plan_id || typeof plan_id !== "string") {
      return NextResponse.json({ error: "plan_id is required" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: plan } = await adminClient.from("pricing_plans").select("id").eq("id", plan_id).maybeSingle()
    if (!plan) {
      return NextResponse.json({ error: "Pricing plan not found" }, { status: 404 })
    }

    const { data: vendor, error } = await adminClient
      .from("users")
      .update({ plan_id })
      .eq("id", id)
      .select("id, full_name, business_name, plan_id")
      .single()

    if (error) {
      console.error("[v0] Error assigning vendor plan:", error.message)
      return NextResponse.json({ error: "Failed to assign plan: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, vendor })
  } catch (error) {
    console.error("[v0] Vendor plan assignment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
