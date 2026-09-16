import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { pricingPlanSchema, validateBody } from "@/lib/utils/validation"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: profile } = await supabase.from("users").select("is_admin").eq("auth_id", user.id).maybeSingle()

  if (!profile?.is_admin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 }),
    }
  }

  return { ok: true as const }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()
  const validation = validateBody(pricingPlanSchema.partial(), body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data: plan, error } = await adminClient
    .from("pricing_plans")
    .update(validation.data)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating pricing plan:", error.message)
    return NextResponse.json({ error: "Failed to update pricing plan: " + error.message }, { status: 500 })
  }

  revalidatePath("/")
  return NextResponse.json({ ok: true, plan })
}

// Soft delete only — vendors may still reference this plan
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params
  const adminClient = createAdminClient()
  const { data: plan, error } = await adminClient
    .from("pricing_plans")
    .update({ is_active: false })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error deactivating pricing plan:", error.message)
    return NextResponse.json({ error: "Failed to deactivate pricing plan: " + error.message }, { status: 500 })
  }

  revalidatePath("/")
  return NextResponse.json({ ok: true, plan })
}
