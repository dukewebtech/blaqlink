import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"
import { validateAddress } from "@/lib/shipping/shipbubble"

/** Validates the vendor's own pickup address with Shipbubble once and caches the resulting address_code. */
export async function POST() {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) return authResult.error

    const supabase = await createServerClient()
    const { data: vendor } = await supabase
      .from("users")
      .select("id, business_name, full_name, email, phone, pickup_street, pickup_city, pickup_state, shipbubble_api_key")
      .eq("id", authResult.user.userId)
      .single()

    if (!vendor?.pickup_street || !vendor.pickup_city || !vendor.pickup_state) {
      return NextResponse.json({ error: "Fill in your pickup address first" }, { status: 400 })
    }
    if (!vendor.email || !vendor.phone) {
      return NextResponse.json({ error: "Your account needs an email and phone number to validate an address" }, { status: 400 })
    }
    if (!vendor.shipbubble_api_key) {
      return NextResponse.json({ error: "Add your Shipbubble API key first" }, { status: 400 })
    }

    const validated = await validateAddress(vendor.shipbubble_api_key, {
      name: vendor.business_name || vendor.full_name || "Store",
      email: vendor.email,
      phone: vendor.phone,
      address: `${vendor.pickup_street}, ${vendor.pickup_city}, ${vendor.pickup_state}`,
    })

    await supabase
      .from("users")
      .update({ shipbubble_sender_address_code: String(validated.addressCode) })
      .eq("id", authResult.user.userId)

    return NextResponse.json({ success: true, formattedAddress: validated.formattedAddress })
  } catch (error) {
    return handleApiError(error, "POST /api/shipping/validate-pickup-address")
  }
}
