import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function createServiceClient() {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  console.log("[v0] Service role key available:", hasServiceKey)
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: user, error } = await supabase
      .from("users")
      .select("id, business_name, full_name, email, phone, location, profile_image, store_template, store_logo_url")
      .eq("id", storeId)
      .maybeSingle()

    console.log("[v0] Store info query result - user:", JSON.stringify(user))
    console.log("[v0] Store info query result - error:", error)
    console.log("[v0] Store template from DB:", user?.store_template)

    if (error) {
      console.error("[v0] Error fetching store info:", error)
      return NextResponse.json({ error: "Failed to fetch store information" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({
        storeInfo: {
          id: storeId,
          business_name: "Store",
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
