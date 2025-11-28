import { NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")
    const type = searchParams.get("type")

    const supabase = createPublicClient()

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 })
    }

    let query = supabase
      .from("categories")
      .select("*")
      .eq("user_id", storeId)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (type) {
      query = query.eq("product_type", type)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error("[v0] Error fetching public categories:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    console.log("[v0] Public categories fetched for store:", storeId, "count:", categories?.length || 0)
    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error("[v0] Error in public categories API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
