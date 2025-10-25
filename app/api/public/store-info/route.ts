import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from("users")
      .select("business_name, full_name, email, phone, location, profile_image")
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching store info:", error)
    }

    // Return user data if found, otherwise return default store info
    return NextResponse.json({
      storeInfo: user || {
        business_name: "Yom Essentials",
        full_name: "henry",
        location: "lagos",
      },
    })
  } catch (error) {
    console.error("[v0] Error in store info API:", error)
    return NextResponse.json({
      storeInfo: {
        business_name: "Yom Essentials",
        full_name: "henry",
        location: "lagos",
      },
    })
  }
}
