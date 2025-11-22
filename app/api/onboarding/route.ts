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

    // Get or create onboarding progress
    let { data: progress } = await supabase.from("onboarding_progress").select("*").eq("user_id", user.id).single()

    if (!progress) {
      const { data: newProgress } = await supabase
        .from("onboarding_progress")
        .insert({ user_id: user.id })
        .select()
        .single()
      progress = newProgress
    }

    const updates: any = {
      current_step: step,
      updated_at: new Date().toISOString(),
    }

    // Add completed step to array if not already there
    const completedSteps = progress?.completed_steps || []
    if (!completedSteps.includes(step)) {
      completedSteps.push(step)
      updates.completed_steps = completedSteps
    }

    switch (step) {
      case 1: // Welcome screen completed
        break

      case 2: // Business Information
        updates.business_name = stepData.businessName
        updates.store_name = stepData.storeName
        updates.business_category = stepData.businessCategory
        updates.business_address = stepData.businessAddress

        // Also update users table
        await supabase
          .from("users")
          .update({
            business_name: stepData.businessName,
          })
          .eq("id", user.id)
        break

      case 3: // Identity Upload (KYC)
        updates.full_name = stepData.fullName
        updates.date_of_birth = stepData.dateOfBirth
        updates.bvn = stepData.bvn
        updates.government_id_url = stepData.governmentIdUrl
        updates.selfie_url = stepData.selfieUrl

        // Update users table with KYC status
        await supabase
          .from("users")
          .update({
            full_name: stepData.fullName,
            kyc_status: "pending_review",
            kyc_submitted_at: new Date().toISOString(),
          })
          .eq("id", user.id)
        break

      case 4: // Bank Account Setup
        updates.bank_name = stepData.bankName
        updates.account_number = stepData.accountNumber
        updates.account_name = stepData.accountName

        // Update users table
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
        updates.store_template = stepData.storeTemplate
        updates.store_logo_url = stepData.storeLogo
        updates.store_brand_color = stepData.brandColor
        updates.onboarding_completed = true
        break
    }

    const { data: updatedProgress, error: updateError } = await supabase
      .from("onboarding_progress")
      .upsert({ user_id: user.id, ...updates })
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating onboarding progress:", updateError)
      return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
    }

    console.log("[v0] Onboarding progress updated successfully")

    return NextResponse.json({ progress: updatedProgress })
  } catch (error) {
    console.error("[v0] Error updating onboarding:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
