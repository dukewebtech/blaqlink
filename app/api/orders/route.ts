import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { sendEmail, getOrderStatusUpdateEmailForCustomer } from "@/lib/email"
import { buildVendorBranding } from "@/lib/storefront/order-emails"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Optional — bounds the query to orders on/after this date instead of the
    // vendor's entire history. The Sales page uses this for its date-range
    // filter instead of fetching everything and filtering client-side.
    const since = request.nextUrl.searchParams.get("since")

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          product_title,
          product_type,
          quantity,
          price,
          subtotal
        )
      `,
      )
      .eq("user_id", userProfile.id)
      .order("created_at", { ascending: false })

    if (since) {
      query = query.gte("created_at", since)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("[v0] Orders fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("[v0] Orders API error:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, status, notifyCustomer } = body

    if (!order_id || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", order_id)
      .eq("user_id", userProfile.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Order update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 })
    }

    // Opt-in per change (the vendor ticks "notify customer" on the order
    // detail page) rather than automatic for every status, since not every
    // transition (e.g. internal "processing") is something a customer needs
    // an email about.
    if (notifyCustomer && data.customer_email) {
      const { data: vendorInfo } = await supabase
        .from("users")
        .select("business_name, full_name, store_logo_url, store_brand_color, store_slug, email, phone, business_address")
        .eq("id", userProfile.id)
        .single()

      const branding = buildVendorBranding(vendorInfo, userProfile.id)
      const statusEmail = getOrderStatusUpdateEmailForCustomer({
        customerName: data.customer_name,
        orderId: data.id,
        status: data.status,
        trackingNumber: data.shipping_tracking_number,
        trackingUrl: data.shipping_tracking_url,
        vendor: branding,
      })

      await sendEmail({
        to: data.customer_email,
        subject: statusEmail.subject,
        html: statusEmail.html,
      }).catch((err) => console.error("[v0] Failed to send status update email:", err))
    }

    return NextResponse.json({ order: data })
  } catch (error) {
    console.error("[v0] Order update API error:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
