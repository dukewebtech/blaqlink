import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, fullName, setupKey } = await request.json()

    // Validate setup key
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json({ error: "Invalid setup key" }, { status: 403 })
    }

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "admin",
      },
    })

    if (authError) {
      console.error("[v0] Admin creation error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create user record in users table with admin privileges
    const { error: userError } = await supabase.from("users").insert({
      auth_id: authData.user.id,
      email: email,
      full_name: fullName,
      role: "admin",
      is_admin: true,
    })

    if (userError) {
      console.error("[v0] User record creation error:", userError)
      // Try to delete the auth user if user record creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Failed to create user record" }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: "Admin user created successfully!",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: "admin",
          is_admin: true,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Admin setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
