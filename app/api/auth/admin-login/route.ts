import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    // Fetch user profile to check admin status
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, is_admin, role")
      .eq("auth_id", authData.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Verify admin access
    if (!userData.is_admin && userData.role !== "admin") {
      // Sign out the user since they don't have admin access
      await supabase.auth.signOut()
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred during login" },
      { status: 500 },
    )
  }
}
