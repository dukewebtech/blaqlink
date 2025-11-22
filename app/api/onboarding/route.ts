import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get onboarding progress
    const { data: progress, error: progressError } = await supabase
      .from("onboarding_progress")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (progressError) {
      console.log("[v0] Creating new onboarding progress for user:", user.id)
      // Create onboarding progress if it doesn't exist
      const { data: newProgress, error: createError } = await supabase
        .from("onboarding_progress")
        .insert({ user_id: user.id })
        .select()
        .single()

      if (createError) {
        console.error("[v0] Error creating onboarding progress:", createError)
        return NextResponse.json({ error: "Failed to create onboarding progress" }, { status: 500 })
      }

      return NextResponse.json({ progress: newProgress })
    }

    // Get user KYC status
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("kyc_status, admin_kyc_approved")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("[v0] Error fetching user data:", userError)
    }

    return NextResponse.json({
      progress,
      kycStatus: userData?.kyc_status || "not_submitted",
      adminKycApproved: userData?.admin_kyc_approved || false,
    })
  } catch (error) {
    console.error("[v0] Error fetching onboarding progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { step, data: stepData } = body

    console.log("[v0] Updating onboarding step:", step, "for user:", user.id)

    // Update onboarding progress based on step
    const updates: any = { updated_at: new Date().toISOString() }

    switch (step) {
      case 2: // Business Information
        updates.business_info_completed = true
        updates.step_completed = 2
        // Update users table with business info
        await supabase
          .from("users")
          .update({
            business_name: stepData.businessName,
            full_name: stepData.storeName,
            business_category: stepData.businessCategory,
            business_address: stepData.businessAddress,
          })
          .eq("id", user.id)
        break

      case 3: // Identity Upload
        updates.kyc_info_completed = true
        updates.step_completed = 3
        // Update users table with KYC info
        await supabase
          .from("users")
          .update({
            full_name: stepData.fullName,
            date_of_birth: stepData.dateOfBirth,
            bvn: stepData.bvn,
            government_id_url: stepData.governmentIdUrl,
            selfie_url: stepData.selfieUrl,
            kyc_status: "pending_review",
          })
          .eq("id", user.id)
        break

      case 4: // Bank Account Setup
        updates.bank_info_completed = true
        updates.step_completed = 4
        // Update users table with bank info
        await supabase
          .from("users")
          .update({
            bank_name: stepData.bankName,
            account_number: stepData.accountNumber,
            account_name: stepData.accountName,
          })
          .eq("id", user.id)
        break

      case 5: // Store Setup
        updates.store_setup_completed = true
        updates.step_completed = 5
        updates.onboarding_completed = true
        // Update users table with store info
        await supabase
          .from("users")
          .update({
            store_template: stepData.storeTemplate,
            store_logo_url: stepData.storeLogo,
            store_brand_color: stepData.brandColor,
          })
          .eq("id", user.id)
        break
    }

    const { data: updatedProgress, error: updateError } = await supabase
      .from("onboarding_progress")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating onboarding progress:", updateError)
      return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
    }

    console.log("[v0] Onboarding progress updated:", updatedProgress)

    return NextResponse.json({ progress: updatedProgress })
  } catch (error) {
    console.error("[v0] Error updating onboarding:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
