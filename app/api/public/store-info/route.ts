import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function createBestAvailableClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Prefer service role key (bypasses RLS) when available
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 })
    }

    const supabase = createBestAvailableClient()

    const { data: user, error } = await supabase
      .from("users")
      .select("id, business_name, full_name, email, phone, location, profile_image, store_template, store_logo_url")
      .eq("id", storeId)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching store info:", error)
      return NextResponse.json({ error: "Failed to fetch store information" }, { status: 500 })
    }

    if (!user) {
      // User not found or RLS blocking — return minimal valid response so storefront still renders
      return NextResponse.json({
        storeInfo: {
          id: storeId,
          business_name: "My Store",
          full_name: "Store Owner",
          location: "Online",
          email: null,
          phone: null,
          profile_image: null,
          store_template: null,
          store_logo_url: null,
        },
      })
    }

    return NextResponse.json({ storeInfo: user })
  } catch (error) {
    console.error("[v0] Error in store info API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
