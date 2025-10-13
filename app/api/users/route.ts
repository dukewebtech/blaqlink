import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get all users from the public.users table
    const { data: users, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: users?.length || 0,
      users: users || [],
    })
  } catch (error) {
    console.error("[v0] Users API error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
