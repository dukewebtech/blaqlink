import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Get current user profile
export async function GET() {
  try {
    console.log("[v0] Fetching current user profile...")
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.log("[v0] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Auth user ID:", authUser.id)

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .maybeSingle()

    if (profileError) {
      console.error("[v0] Error fetching user profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
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

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.log("[v0] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] Update data:", { ...body, profile_image: body.profile_image ? "..." : null })

    const { data: existingProfile } = await supabase.from("users").select("id").eq("auth_id", authUser.id).maybeSingle()

    if (!existingProfile) {
      console.log("[v0] Creating new user profile...")
      const { data: newProfile, error: createError } = await supabase
        .from("users")
        .insert({
          auth_id: authUser.id,
          email: authUser.email || body.email,
          full_name: body.full_name || authUser.user_metadata?.full_name,
          phone: body.phone,
          location: body.location,
          business_name: body.business_name,
          profile_image: body.profile_image,
          role: authUser.user_metadata?.role || "vendor",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error("[v0] Error creating user profile:", createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      console.log("[v0] User profile created successfully")
      return NextResponse.json({
        ok: true,
        data: { user: newProfile },
      })
    }

    // Update user profile in public.users table
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        location: body.location,
        business_name: body.business_name,
        profile_image: body.profile_image,
        updated_at: new Date().toISOString(),
      })
      .eq("auth_id", authUser.id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating user profile:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log("[v0] User profile updated successfully")

    return NextResponse.json({
      ok: true,
      data: { user: updatedUser },
    })
  } catch (error) {
    console.error("[v0] User profile update API error:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}
