import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"

/**
 * Can buyers get this vendor's physical products delivered?
 * Manual mode needs at least one active delivery area; live-rate modes
 * (Terminal Africa / Shipbubble) quote at checkout.
 */
export async function GET() {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) return authResult.error
    const userId = authResult.user.userId
    const supabase = await createServerClient()

    const [{ data: vendor }, { count: areaCount }, { count: physicalCount }] = await Promise.all([
      supabase.from("users").select("shipping_mode").eq("id", userId).maybeSingle(),
      supabase.from("delivery_areas").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_active", true),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("product_type", "physical")
        .eq("status", "published"),
    ])

    const liveRates = !!vendor?.shipping_mode && vendor.shipping_mode !== "manual"
    return NextResponse.json({
      hasDeliveryOptions: liveRates || (areaCount ?? 0) > 0,
      hasPhysicalProducts: (physicalCount ?? 0) > 0,
    })
  } catch (error) {
    return handleApiError(error, "GET /api/delivery-areas/status")
  }
}
