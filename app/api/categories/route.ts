import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Categories are shared by every product type, so no type filter.
    const [{ data: categories, error }, { data: productCategories }] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", userProfile.id).order("name"),
      supabase.from("products").select("category").eq("user_id", userProfile.id).not("category", "is", null),
    ])

    if (error) {
      console.error("[categories] list failed:", error.message)
      return NextResponse.json({ error: "Failed to load categories" }, { status: 500 })
    }

    const counts = new Map<string, number>()
    for (const p of productCategories ?? []) counts.set(p.category as string, (counts.get(p.category as string) ?? 0) + 1)
    const categoriesWithCounts = (categories ?? []).map((category) => ({
      ...category,
      products: [{ count: counts.get(category.id) ?? 0 }],
    }))

    return NextResponse.json({ categories: categoriesWithCounts })
  } catch (error) {
    console.error("[v0] Categories API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name || name.length > 60) {
      return NextResponse.json({ error: "Give the category a name of up to 60 characters." }, { status: 400 })
    }

    const { data: existing } = await supabase.from("categories").select("id").eq("user_id", userProfile.id).ilike("name", name).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: "You already have a category with that name." }, { status: 409 })
    }

    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        user_id: userProfile.id,
        name,
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        image_url: typeof body.image_url === "string" ? body.image_url : null,
        status: body.status === "inactive" ? "inactive" : "active",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating category:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
