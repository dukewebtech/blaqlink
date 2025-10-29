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

    const { searchParams } = new URL(request.url)
    const productType = searchParams.get("type")

    let query = supabase
      .from("categories")
      .select(
        `
        *,
        products:products(count)
      `,
      )
      .eq("user_id", userProfile.id)
      .order("created_at", { ascending: false })

    if (productType) {
      query = query.eq("product_type", productType)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error("[v0] Error fetching categories:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ categories })
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

    const body = await request.json()

    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        user_id: userProfile.id,
        name: body.name,
        product_type: body.product_type,
        description: body.description,
        image_url: body.image_url,
        status: body.status || "active",
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
