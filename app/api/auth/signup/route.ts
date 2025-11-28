// Keeping this file for backward compatibility, but it's not actively used
// The signup page now uses supabase.auth.signUp() directly from the client

import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role = "vendor" } = await request.json()

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })

    if (error) {
      console.error("[v0] Signup error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Check if email confirmation is required
    if (data.user && !data.user.confirmed_at && data.user.confirmation_sent_at) {
      return NextResponse.json(
        {
          error:
            "Email confirmation is enabled. Please disable 'Email Confirmations' in your Supabase Dashboard (Authentication → Providers → Email) to allow automatic verification.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        message: "Account created successfully! You can now login with your credentials.",
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
