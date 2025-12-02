import { createServerClient, createAdminClient } from "@/lib/supabase/server"
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

    const adminClient = createAdminClient()

    // Check if user is admin
    const { data: adminData } = await adminClient.from("users").select("is_admin, role").eq("id", user.id).single()

    if (!adminData?.is_admin && adminData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = (await params).id

    const { data: userData, error: userError } = await adminClient.from("users").select("*").eq("id", userId).single()

    if (userError) {
      console.error("[v0] Error fetching user data:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { data: onboardingData, error: onboardingError } = await adminClient
      .from("onboarding_progress")
      .select("*")
      .eq("user_id", userId)
      .single()

    // Return user data even if onboarding data is not found
    return NextResponse.json({
      user: userData,
      onboarding: {
        business_name: userData.business_name || "",
        store_name: userData.store_name || "",
        business_category: userData.business_category || "",
        business_address: userData.business_address || "",
        full_name: userData.full_name || "",
        date_of_birth: userData.date_of_birth || "",
        bvn: userData.bvn || "",
        government_id_url: userData.government_id_url || "",
        selfie_url: userData.selfie_url || "",
        bank_name: userData.bank_name || "",
        account_number: userData.account_number || "",
        account_name: userData.account_name || "",
        ...(onboardingData || {}),
      },
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

    const adminClient = createAdminClient()

    // Check if user is admin
    const { data: adminData } = await adminClient.from("users").select("is_admin, role").eq("id", user.id).single()

    if (!adminData?.is_admin && adminData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = (await params).id
    const body = await request.json()
    const { approved, rejection_reason } = body

    // Update KYC status using admin client to bypass RLS
    const updates: Record<string, any> = {
      admin_kyc_approved: approved,
      kyc_status: approved ? "approved" : "rejected",
    }

    if (approved) {
      updates.kyc_approved_at = new Date().toISOString()
    } else if (rejection_reason) {
      updates.kyc_rejection_reason = rejection_reason
    }

    const { error: updateError } = await adminClient.from("users").update(updates).eq("id", userId)

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
