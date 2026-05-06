import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"

const VALID_STATUSES = ["draft", "published", "archived"]

type ImportProduct = {
  title: string
  description: string | null
  price: number | null
  product_type: string
  category: string | null
  status: string
  images: string[]
  sku: string | null
  stock_quantity: number | null
  event_date: string | null
  event_location: string | null
  duration_minutes: number | null
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) {
      return authResult.error
    }

    const { products } = (await request.json()) as { products: ImportProduct[] }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products provided" }, { status: 400 })
    }

    if (products.length > 100) {
      return NextResponse.json({ error: "Maximum 100 products per import" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const results = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[],
    }

    // Process products one by one to track individual errors
    for (let i = 0; i < products.length; i++) {
      const product = products[i]

      // Validate required fields
      if (!product.title) {
        results.failed++
        results.errors.push({ row: i + 1, error: "Title is required" })
        continue
      }

      if (!product.product_type) {
        results.failed++
        results.errors.push({ row: i + 1, error: "Product type is required" })
        continue
      }

      const normalizedStatus = (product.status || "draft").toLowerCase().trim()
      const validStatus = VALID_STATUSES.includes(normalizedStatus) ? normalizedStatus : "draft"

      const productData = {
        user_id: authResult.user.userId,
        title: product.title,
        description: product.description || null,
        price: product.price || null,
        product_type: product.product_type,
        category: product.category || null,
        status: validStatus,
        images: product.images || [],
        sku: product.sku || null,
        stock_quantity: product.stock_quantity || null,
        event_date: product.event_date || null,
        event_location: product.event_location || null,
        duration_minutes: product.duration_minutes || null,
      }

      const { error } = await supabase.from("products").insert(productData)

      if (error) {
        results.failed++
        results.errors.push({ row: i + 1, error: error.message })
      } else {
        results.imported++
      }
    }

    results.success = results.imported > 0

    return NextResponse.json(results, {
      status: results.imported > 0 ? 200 : 400,
    })
  } catch (error) {
    return handleApiError(error, "POST /api/products/import")
  }
}
