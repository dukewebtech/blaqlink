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

    const { data: upsertedProfile, error: upsertError } = await supabase
      .from("users")
      .upsert(
        {
          id: authUser.id,
          auth_id: authUser.id,
          email: authUser.email || body.email,
          full_name: body.full_name || authUser.user_metadata?.full_name || "New User",
          phone: body.phone,
          location: body.location,
          business_name: body.business_name,
          profile_image: body.profile_image,
          role: body.role || authUser.user_metadata?.role || "vendor",
          onboarding_completed: body.onboarding_completed ?? false,
          kyc_status: body.kyc_status || "not_submitted",
          admin_kyc_approved: body.admin_kyc_approved ?? false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        },
      )
      .select()
      .maybeSingle()

    if (upsertError) {
      console.error("[v0] Error upserting user profile:", upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    console.log("[v0] User profile upserted successfully")

    return NextResponse.json({
      ok: true,
      data: { user: upsertedProfile },
    })
  } catch (error) {
    console.error("[v0] User profile update API error:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}
