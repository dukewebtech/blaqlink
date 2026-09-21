import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"
import { validateAreaLocation } from "@/lib/storefront/delivery"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) return authResult.error

    const body = await request.json()
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : ""
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
      update.name = name
    }
    if (body.fee !== undefined) {
      const fee = Number(body.fee)
      if (!Number.isFinite(fee) || fee < 0) {
        return NextResponse.json({ error: "Fee must be a valid, non-negative amount" }, { status: 400 })
      }
      update.fee = fee
    }
    if (body.note !== undefined) update.note = body.note?.trim() || null
    if (body.is_active !== undefined) update.is_active = !!body.is_active
    if (body.sort_order !== undefined) update.sort_order = Number(body.sort_order)

    if (body.state !== undefined || body.city !== undefined) {
      const location = validateAreaLocation(body.state, body.city, { requireState: true })
      if (!location.ok) {
        return NextResponse.json({ error: location.error }, { status: 400 })
      }
      update.state = location.state
      update.city = location.city
    }

    const supabase = await createServerClient()
    const { data: area, error } = await supabase
      .from("delivery_areas")
      .update(update)
      .eq("id", id)
      .eq("user_id", authResult.user.userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ area })
  } catch (error) {
    return handleApiError(error, "PUT /api/delivery-areas/[id]")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) return authResult.error

    const supabase = await createServerClient()
    const { error } = await supabase
      .from("delivery_areas")
      .delete()
      .eq("id", id)
      .eq("user_id", authResult.user.userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/delivery-areas/[id]")
  }
}
