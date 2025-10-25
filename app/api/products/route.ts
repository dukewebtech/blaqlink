import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/products - Starting request")
    const supabase = await createServerClient()

    // Get authenticated user
    console.log("[v0] Attempting to get authenticated user...")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth result:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    })

    if (authError) {
      console.error("[v0] Authentication error:", authError)
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: authError.message,
        },
        { status: 401 },
      )
    }

    if (!user) {
      console.error("[v0] No user found in session")
      return NextResponse.json(
        {
          error: "Unauthorized - Please log in again",
          details: "No active session found",
        },
        { status: 401 },
      )
    }

    console.log("[v0] User authenticated successfully:", user.id)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const productType = searchParams.get("type")
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("[v0] Query params:", { productType, status, limit, offset })

    // Build query
    let query = supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (productType) {
      query = query.eq("product_type", productType)
    }
    if (status) {
      query = query.eq("status", status)
    }

    console.log("[v0] Executing products query...")
    const { data: products, error } = await query

    if (error) {
      console.error("[v0] Error fetching products:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Products fetched successfully:", products?.length || 0)
    return NextResponse.json({ products, count: products?.length || 0 })
  } catch (error) {
    console.error("[v0] Unexpected error in GET /api/products:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.product_type || !body.title) {
      return NextResponse.json({ error: "Missing required fields: product_type and title" }, { status: 400 })
    }

    // Validate product type
    const validTypes = ["digital", "event", "physical", "appointment"]
    if (!validTypes.includes(body.product_type)) {
      return NextResponse.json(
        { error: "Invalid product_type. Must be one of: digital, event, physical, appointment" },
        { status: 400 },
      )
    }

    // Prepare product data
    const productData = {
      user_id: user.id,
      product_type: body.product_type,
      title: body.title,
      description: body.description || null,
      price: body.price || null,
      category: body.category || null,
      status: body.status || "draft",
      images: body.images || [],

      // Digital product fields
      file_urls: body.file_urls || [],
      license_type: body.license_type || null,
      download_limit: body.download_limit || null,

      // Event fields
      event_date: body.event_date || null,
      event_location: body.event_location || null,
      is_paid_ticket: body.is_paid_ticket ?? true,
      ticket_types: body.ticket_types || null,
      total_capacity: body.total_capacity || null,

      // Physical product fields
      sku: body.sku || null,
      stock_quantity: body.stock_quantity || null,
      is_automated_delivery: body.is_automated_delivery ?? false,
      logistics_api_key: body.logistics_api_key || null,
      shipping_locations: body.shipping_locations || null,

      // Appointment fields
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
    console.error("[v0] Unexpected error in POST /api/products:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
