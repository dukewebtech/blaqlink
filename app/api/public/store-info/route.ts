import { NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 })
    }

    const supabase = createPublicClient()

    console.log("[v0] Fetching store info for storeId:", storeId)

    const { data: user, error } = await supabase
      .from("users")
      .select("id, business_name, full_name, email, phone, location, profile_image")
      .eq("id", storeId)
      .maybeSingle()

    console.log("[v0] Store info query result:", { user, error })

    if (error) {
      console.error("[v0] Error fetching store info:", error)
      return NextResponse.json({ error: "Failed to fetch store information" }, { status: 500 })
    }

    if (!user) {
      console.log("[v0] User not found, returning default store info")
      return NextResponse.json({
        storeInfo: {
          id: storeId,
          business_name: "Store",
          full_name: "Store Owner",
          location: "Online",
          email: null,
          phone: null,
          profile_image: null,
        },
      })
    }

    console.log("[v0] Store info fetched for store:", storeId)
    return NextResponse.json({ storeInfo: user })
  } catch (error) {
    console.error("[v0] Error in store info API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
