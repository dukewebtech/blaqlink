import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminData } = await supabase.from("users").select("is_admin, role").eq("id", user.id).single()

    if (!adminData?.is_admin && adminData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = params.id

    // Get user data
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get onboarding data
    const { data: onboardingData, error: onboardingError } = await supabase
      .from("onboarding_progress")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (onboardingError) {
      return NextResponse.json({ error: "Onboarding data not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: userData,
      onboarding: onboardingData,
    })
  } catch (error) {
    console.error("[v0] Error fetching KYC details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminData } = await supabase.from("users").select("is_admin, role").eq("id", user.id).single()

    if (!adminData?.is_admin && adminData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = params.id
    const body = await request.json()
    const { approved } = body

    // Update KYC status
    const updates: any = {
      admin_kyc_approved: approved,
      kyc_status: approved ? "approved" : "rejected",
    }

    if (approved) {
      updates.kyc_approved_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase.from("users").update(updates).eq("id", userId)

    if (updateError) {
      console.error("[v0] Error updating KYC status:", updateError)
      return NextResponse.json({ error: "Failed to update KYC status" }, { status: 500 })
    }

    console.log("[v0] KYC status updated for user:", userId, "approved:", approved)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating KYC status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
