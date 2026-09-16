import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
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

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminClient()
  const { data: plans, error } = await supabase.from("pricing_plans").select("*").order("display_order")

  if (error) {
    console.error("[v0] Error fetching pricing plans:", error.message)
    return NextResponse.json({ error: "Failed to fetch pricing plans" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plans })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json()
  const validation = validateBody(pricingPlanSchema, body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data: plan, error } = await adminClient.from("pricing_plans").insert(validation.data).select().single()

  if (error) {
    console.error("[v0] Error creating pricing plan:", error.message)
    return NextResponse.json({ error: "Failed to create pricing plan: " + error.message }, { status: 500 })
  }

  revalidatePath("/")
  return NextResponse.json({ ok: true, plan })
}
