import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

const PRODUCT_TYPES = ["physical", "digital", "event", "appointment"]

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

    // ?type= narrows to that product type's categories. Categories without a
    // type (made before types were tracked) still appear for every type.
    const type = new URL(request.url).searchParams.get("type")
    let categoriesQuery = supabase.from("categories").select("*").eq("user_id", userProfile.id).order("name")
    if (type && PRODUCT_TYPES.includes(type)) categoriesQuery = categoriesQuery.or(`product_type.eq.${type},product_type.is.null`)
    const [{ data: categories, error }, { data: productCategories }] = await Promise.all([
      categoriesQuery,
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

    const productType = typeof body.product_type === "string" ? body.product_type : ""
    if (!PRODUCT_TYPES.includes(productType)) {
      return NextResponse.json({ error: "Choose which kind of item this category is for." }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userProfile.id)
      .eq("product_type", productType)
      .ilike("name", name.replace(/[%_\\]/g, (c: string) => `\\${c}`))
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: "You already have a category with that name for this kind of item." }, { status: 409 })
    }

    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        user_id: userProfile.id,
        name,
        product_type: productType,
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
