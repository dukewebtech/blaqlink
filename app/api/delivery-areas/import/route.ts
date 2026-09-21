import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"
import { validateAreaLocation } from "@/lib/storefront/delivery"

type ImportArea = {
  name: string
  fee: number | null
  note: string | null
  state: string | null
  city: string | null
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) return authResult.error

    const { areas } = (await request.json()) as { areas: ImportArea[] }

    if (!areas || !Array.isArray(areas) || areas.length === 0) {
      return NextResponse.json({ error: "No delivery areas provided" }, { status: 400 })
    }
    if (areas.length > 100) {
      return NextResponse.json({ error: "Maximum 100 delivery areas per import" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: existing } = await supabase
      .from("delivery_areas")
      .select("sort_order")
      .eq("user_id", authResult.user.userId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextSortOrder = (existing?.sort_order ?? -1) + 1

    const results = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[],
    }

    // Process rows one by one to track individual errors, same pattern as /api/products/import.
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i]

      if (!area.name || !area.name.trim()) {
        results.failed++
        results.errors.push({ row: i + 1, error: "Name is required" })
        continue
      }
      if (area.fee == null || !Number.isFinite(area.fee) || area.fee < 0) {
        results.failed++
        results.errors.push({ row: i + 1, error: "Fee must be a valid, non-negative amount" })
        continue
      }

      const location = validateAreaLocation(area.state, area.city, { requireState: true })
      if (!location.ok) {
        results.failed++
        results.errors.push({ row: i + 1, error: location.error })
        continue
      }

      const { error } = await supabase.from("delivery_areas").insert({
        user_id: authResult.user.userId,
        name: area.name.trim(),
        fee: area.fee,
        note: area.note?.trim() || null,
        state: location.state,
        city: location.city,
        sort_order: nextSortOrder,
        is_active: true,
      })

      if (error) {
        results.failed++
        results.errors.push({ row: i + 1, error: error.message })
      } else {
        results.imported++
        nextSortOrder++
      }
    }

    results.success = results.imported > 0

    if (results.imported === 0) {
      const firstError = results.errors[0]?.error || "Unknown error"
      return NextResponse.json(
        { ...results, error: `All ${results.failed} row(s) failed to import. Row ${results.errors[0]?.row}: ${firstError}` },
        { status: 400 },
      )
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    return handleApiError(error, "POST /api/delivery-areas/import")
  }
}
