import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Test: Fetching current user...")
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Test: No authenticated user")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("[v0] Test: Auth user ID:", user.id)

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single()

    if (profileError) {
      console.log("[v0] Test: Profile error:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    console.log("[v0] Test: User profile:", profile.email)

    return NextResponse.json({
      user: {
        auth_id: user.id,
        email: user.email,
        profile_id: profile.id,
        full_name: profile.full_name,
        business_name: profile.business_name,
      },
    })
  } catch (error) {
    console.error("[v0] Test: Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
