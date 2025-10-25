import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Categories GET - Creating Supabase client...")
    const supabase = await createServerClient()

    console.log("[v0] Categories GET - Getting user...")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[v0] Categories GET - Auth error:", authError)
      return NextResponse.json({ error: "Authentication failed: " + authError.message }, { status: 401 })
    }

    if (!user) {
      console.error("[v0] Categories GET - No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Categories GET - User authenticated:", user.email)

    const { data: userProfile } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

    if (!userProfile) {
      console.error("[v0] Categories GET - User profile not found for auth_id:", user.id)
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

    console.log("[v0] Categories GET - Found", categories?.length || 0, "categories")
    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error("[v0] Categories API error:", error)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Categories POST - Creating Supabase client...")
    const supabase = await createServerClient()

    console.log("[v0] Categories POST - Getting user...")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[v0] Categories POST - Auth error:", authError)
      return NextResponse.json({ error: "Authentication failed: " + authError.message }, { status: 401 })
    }

    if (!user) {
      console.error("[v0] Categories POST - No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Categories POST - User authenticated:", user.email)

    const { data: userProfile } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

    if (!userProfile) {
      console.error("[v0] Categories POST - User profile not found for auth_id:", user.id)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const body = await request.json()
    console.log("[v0] Categories POST - Creating category:", body.name)

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

    console.log("[v0] Category created successfully:", category.id)
    return NextResponse.json({ category }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create category error:", error)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}
