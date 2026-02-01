import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, created_at, business_name, phone, location, profile_image")
      .eq("auth_id", user.id)
      .single()

    if (error) {
      console.error("[v0] Error fetching user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: userProfile,
    })
  } catch (error) {
    console.error("[v0] Users API error:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
