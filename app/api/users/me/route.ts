import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Get current user profile
export async function GET() {
  try {
    console.log("[v0] Fetching current user profile...")
    const supabase = await createServerClient()

    let authUser
    try {
      const { data, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.log("[v0] Auth error:", authError.message)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      authUser = data.user
    } catch (authFetchError) {
      console.error("[v0] Failed to fetch auth user:", authFetchError)
      return NextResponse.json(
        {
          error: "Authentication service unavailable",
          details: "Please refresh the page",
        },
        { status: 503 },
      )
    }

    if (!authUser) {
      console.log("[v0] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Auth user ID:", authUser.id)

    let userProfile
    const { data: profileById } = await supabase.from("users").select("*").eq("id", authUser.id).maybeSingle()

    if (profileById) {
      userProfile = profileById
    } else {
      const { data: profileByAuthId } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .maybeSingle()
      userProfile = profileByAuthId
    }

    if (!userProfile) {
      console.log("[v0] No profile found for user")
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    console.log("[v0] User profile fetched successfully:", userProfile.email)

    return NextResponse.json({
      ok: true,
      data: { user: userProfile },
    })
  } catch (error) {
    console.error("[v0] User profile API error:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

// Update current user profile
export async function PUT(request: Request) {
  try {
    console.log("[v0] Updating user profile...")
    const supabase = await createServerClient()

    let authUser
    try {
      const { data, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.log("[v0] Auth error:", authError.message)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      authUser = data.user
    } catch (authFetchError) {
      console.error("[v0] Failed to fetch auth user:", authFetchError)
      return NextResponse.json(
        {
          error: "Authentication service unavailable",
          details: "Please refresh the page",
        },
        { status: 503 },
      )
    }

    if (!authUser) {
      console.log("[v0] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] Update data:", { ...body, profile_image: body.profile_image ? "..." : null })

    // The handle_new_user() trigger creates profiles automatically on signup
    let userProfile
    const { data: profileById } = await supabase.from("users").select("*").eq("id", authUser.id).maybeSingle()

    if (profileById) {
      userProfile = profileById
    } else {
      const { data: profileByAuthId } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .maybeSingle()
      userProfile = profileByAuthId
    }

    if (!userProfile) {
      console.log("[v0] Profile not found - trigger should have created it on signup")
      return NextResponse.json(
        {
          error: "Profile not found",
          message: "Please try logging in again. Your profile will be created automatically.",
        },
        { status: 404 },
      )
    }

    console.log("[v0] User profile fetched successfully")

    return NextResponse.json({
      ok: true,
      data: { user: userProfile },
    })
  } catch (error) {
    console.error("[v0] User profile update API error:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}
