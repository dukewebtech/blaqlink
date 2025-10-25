import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Admin setup: User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setupKey } = await request.json()

    // Verify setup key (you can change this to your own secret key)
    const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || "admin123"

    if (setupKey !== ADMIN_SETUP_KEY) {
      console.log("[v0] Admin setup: Invalid setup key")
      return NextResponse.json({ error: "Invalid setup key" }, { status: 403 })
    }

    // Get user record from users table
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userRecord) {
      console.log("[v0] Admin setup: User record not found")
      return NextResponse.json({ error: "User record not found" }, { status: 404 })
    }

    // Update user to admin
    const { error: updateError } = await supabase.from("users").update({ is_admin: true }).eq("id", userRecord.id)

    if (updateError) {
      console.log("[v0] Admin setup error:", updateError.message)
      return NextResponse.json({ error: "Failed to set admin role" }, { status: 500 })
    }

    console.log("[v0] Admin setup successful for user:", userRecord.email)

    return NextResponse.json({
      success: true,
      message: "Admin role granted successfully",
    })
  } catch (error) {
    console.error("[v0] Admin setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
