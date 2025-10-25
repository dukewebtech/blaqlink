import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all products with user info
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        `
        *,
        users!products_user_id_fkey (
          id,
          business_name,
          email
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (productsError) {
      console.error("[v0] Error fetching products:", productsError)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    console.log(`[v0] Admin fetched ${products?.length || 0} products`)

    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error("[v0] Admin products error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
