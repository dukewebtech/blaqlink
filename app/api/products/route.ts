import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"
import { validateBody, productSchema } from "@/lib/utils/validation"

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) {
      return authResult.error
    }

    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const productType = searchParams.get("type")
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("user_id", authResult.user.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (productType) {
      query = query.eq("product_type", productType)
    }
    if (status) {
      query = query.eq("status", status)
    }

    const { data: products, error, count } = await query

    if (error) {
      console.error("[v0] Error fetching products:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      products: products || [],
      count: count || 0,
    })
  } catch (error) {
    return handleApiError(error, "GET /api/products")
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) {
      return authResult.error
    }

    const body = await request.json()

    const validation = validateBody(productSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const supabase = await createServerClient()

    const productData = {
      user_id: authResult.user.userId,
      product_type: validation.data.product_type,
      title: validation.data.title,
      description: validation.data.description || null,
      price: validation.data.price || null,
      category: validation.data.category || null,
      status: validation.data.status || "draft",
      images: validation.data.images || [],
      file_urls: body.file_urls || [],
      license_type: body.license_type || null,
      download_limit: body.download_limit || null,
      event_date: body.event_date || null,
      event_location: body.event_location || null,
      is_paid_ticket: body.is_paid_ticket ?? true,
      ticket_types: body.ticket_types || null,
      total_capacity: body.total_capacity || null,
      sku: body.sku || null,
      stock_quantity: body.stock_quantity || null,
      is_automated_delivery: body.is_automated_delivery ?? false,
      logistics_api_key: body.logistics_api_key || null,
      shipping_locations: body.shipping_locations || null,
      duration_minutes: body.duration_minutes || null,
      available_days: body.available_days || [],
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      booking_link: body.booking_link || null,
    }

    const { data: product, error } = await supabase.from("products").insert(productData).select().single()

    if (error) {
      console.error("[v0] Error creating product:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Product created successfully:", product.id)
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/products")
  }
}
