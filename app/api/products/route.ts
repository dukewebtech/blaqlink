import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"
import { saveProduct } from "@/lib/products/service"

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
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") || "50") || 50, 1), 200)
    const offset = Math.max(Number.parseInt(searchParams.get("offset") || "0") || 0, 0)

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
      console.error("[products] list failed:", error.message)
      return NextResponse.json({ error: "Failed to load products" }, { status: 500 })
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

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const result = await saveProduct(authResult.user.userId, null, body)
    if (!result.ok) {
      return NextResponse.json({ error: result.message, errors: result.errors }, { status: result.status })
    }
    return NextResponse.json({ product: result.product }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/products")
  }
}
