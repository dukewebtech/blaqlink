import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const supabase = await createClient()

    let query = supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          product_type,
          image_url
        )
      `)
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

    const { data: products, error } = await query

    if (error) {
      console.error("[v0] Error fetching public products:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    console.log("[v0] Public products fetched:", products?.length || 0)
    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error("[v0] Error in public products API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
