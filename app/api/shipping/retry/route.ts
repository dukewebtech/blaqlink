import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"
import { runShipmentBooking } from "@/lib/storefront/fulfilment"

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) return authResult.error

    const { orderId } = (await request.json()) as { orderId: string }
    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 })

    const supabase = await createServerClient()
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, shipping_provider, shipping_rate_id, shipping_request_token, shipping_status")
      .eq("id", orderId)
      .eq("user_id", authResult.user.userId)
      .maybeSingle()

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (!order.shipping_provider) {
      return NextResponse.json({ error: "This order has no shipment to book" }, { status: 400 })
    }

    await runShipmentBooking(order)

    const { data: updated } = await supabase
      .from("orders")
      .select("shipping_status, shipping_tracking_number, shipping_tracking_url")
      .eq("id", orderId)
      .single()

    return NextResponse.json({ success: updated?.shipping_status === "booked", order: updated })
  } catch (error) {
    return handleApiError(error, "POST /api/shipping/retry")
  }
}
