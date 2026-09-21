import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"
import { validateAreaLocation } from "@/lib/storefront/delivery"

export async function GET() {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) return authResult.error

    const supabase = await createServerClient()
    const { data: areas, error } = await supabase
      .from("delivery_areas")
      .select("id, name, note, fee, state, city, sort_order, is_active, created_at")
      .eq("user_id", authResult.user.userId)
      .order("sort_order", { ascending: true })

    if (error) throw error

    return NextResponse.json({ areas: areas ?? [] })
  } catch (error) {
    return handleApiError(error, "GET /api/delivery-areas")
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) return authResult.error

    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const fee = Number(body.fee)

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!Number.isFinite(fee) || fee < 0) {
      return NextResponse.json({ error: "Fee must be a valid, non-negative amount" }, { status: 400 })
    }

    const location = validateAreaLocation(body.state, body.city, { requireState: true })
    if (!location.ok) {
      return NextResponse.json({ error: location.error }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: existing } = await supabase
      .from("delivery_areas")
      .select("sort_order")
      .eq("user_id", authResult.user.userId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: area, error } = await supabase
      .from("delivery_areas")
      .insert({
        user_id: authResult.user.userId,
        name,
        note: body.note?.trim() || null,
        fee,
        state: location.state,
        city: location.city,
        sort_order: (existing?.sort_order ?? -1) + 1,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ area }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/delivery-areas")
  }
}
