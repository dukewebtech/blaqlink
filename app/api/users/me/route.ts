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
        if (authError.message.includes("session") || authError.message.includes("Auth")) {
          return NextResponse.json({ error: "Session not ready. Please wait a moment and try again." }, { status: 401 })
        }
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
      return NextResponse.json({ error: "Session not found. Please log in again." }, { status: 401 })
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
      console.log("[v0] No profile found, creating one from auth user metadata...")

      const metadata = authUser.user_metadata || {}
      const fullName = metadata.full_name || authUser.email?.split("@")[0] || "User"

      const { data: newProfile, error: createError } = await supabase
        .from("users")
        .insert({
          id: authUser.id,
          auth_id: authUser.id,
          email: authUser.email,
          full_name: fullName,
          role: metadata.role || "vendor",
          onboarding_completed: false,
          kyc_status: "not_submitted",
          admin_kyc_approved: false,
        })
        .select()
        .single()

      if (createError) {
        console.error("[v0] Failed to create profile:", createError)
        return NextResponse.json(
          {
            error: "Failed to create user profile",
            details: createError.message,
          },
          { status: 500 },
        )
      }

      userProfile = newProfile
      console.log("[v0] Profile created successfully:", userProfile.email)
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
        if (authError.message.includes("session") || authError.message.includes("Auth")) {
          return NextResponse.json({ error: "Session not ready. Please wait a moment and try again." }, { status: 401 })
        }
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
      return NextResponse.json({ error: "Session not found. Please log in again." }, { status: 401 })
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

    // Update user profile with new data
    const { data: updatedProfile, error: updateError } = await supabase
      .from("users")
      .update(body)
      .eq("id", authUser.id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Failed to update profile:", updateError)
      return NextResponse.json(
        {
          error: "Failed to update user profile",
          details: updateError.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Profile updated successfully:", updatedProfile.email)

    return NextResponse.json({
      ok: true,
      data: { user: updatedProfile },
    })
  } catch (error) {
    console.error("[v0] User profile update API error:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}
