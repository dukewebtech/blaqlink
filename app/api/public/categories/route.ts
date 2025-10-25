import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const supabase = await createClient()

    let query = supabase.from("categories").select("*").eq("status", "active").order("created_at", { ascending: false })

    if (type) {
      query = query.eq("product_type", type)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error("[v0] Error fetching public categories:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error("[v0] Error in public categories API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
