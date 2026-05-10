import { NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")
    const type = searchParams.get("type")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const limit = Math.min(Number(searchParams.get("limit") ?? "24"), 100)
    const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0)

    const supabase = createPublicClient()

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 })
    }

    let query = supabase
      .from("products")
      .select(
        `*, categories (id, name, product_type, image_url)`,
        { count: "exact" },
      )
      .eq("user_id", storeId)
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (type) {
      query = query.eq("product_type", type)
    }

    if (category) {
      query = query.eq("category", category)
    }

    if (search) {
      query = query.ilike("title", `%${search}%`)
    }

    const { data: products, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("[v0] Error fetching public products:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    console.log("[v0] Public products fetched for store:", storeId, "count:", products?.length || 0)
    return NextResponse.json({ products: products || [], total: count ?? null, limit, offset })
  } catch (error) {
    console.error("[v0] Error in public products API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
