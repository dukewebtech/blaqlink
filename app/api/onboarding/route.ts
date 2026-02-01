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

    const { data: progress, error: progressError } = await supabase
      .from("onboarding_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!progress && progressError?.code !== "PGRST116") {
      console.log("[v0] Onboarding progress table error:", progressError)
      return NextResponse.json(
        {
          error: "Onboarding system not ready",
          details: progressError?.message,
        },
        { status: 503 },
      )
    }

    if (!progress) {
      console.log("[v0] Creating new onboarding progress for user:", user.id)
      const { data: newProgress, error: createError } = await supabase
        .from("onboarding_progress")
        .insert({ user_id: user.id })
        .select()
        .maybeSingle()

      if (createError) {
        console.error("[v0] Error creating onboarding progress:", createError.message)
        // Return a default progress object instead of failing
        return NextResponse.json({
          progress: {
            user_id: user.id,
            current_step: 1,
            completed_steps: [],
            onboarding_completed: false,
          },
          kycStatus: "not_submitted",
          adminKycApproved: false,
        })
      }

      // Get user KYC status
      const { data: userData } = await supabase
        .from("users")
        .select("kyc_status, admin_kyc_approved, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle()

      return NextResponse.json({
        progress: newProgress,
        kycStatus: userData?.kyc_status || "not_submitted",
        adminKycApproved: userData?.admin_kyc_approved || false,
      })
    }

    // Get user KYC status
    const { data: userData } = await supabase
      .from("users")
      .select("kyc_status, admin_kyc_approved, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle()

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

    let { data: progress } = await supabase.from("onboarding_progress").select("*").eq("user_id", user.id).maybeSingle()

    if (!progress) {
      const { data: newProgress } = await supabase
        .from("onboarding_progress")
        .insert({ user_id: user.id })
        .select()
        .maybeSingle()
      progress = newProgress
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    switch (step) {
      case 1: // Welcome screen completed
        updates.business_info_completed = false
        break

      case 2: // Business Information
        updates.business_info_completed = true

        await supabase
          .from("users")
          .update({
            business_name: stepData.businessName,
            store_name: stepData.storeName,
            business_category: stepData.businessCategory,
            business_address: stepData.businessAddress,
          })
          .eq("id", user.id)
        break

      case 3: // Identity Upload (KYC)
        updates.kyc_info_completed = true

        // Update users table with KYC status
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
        updates.store_setup_completed = true
        updates.onboarding_completed = true

        await supabase
          .from("users")
          .update({
            store_template: stepData.storeTemplate,
            store_logo_url: stepData.storeLogo,
            store_brand_color: stepData.brandColor,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
        break
    }

    const { data: updatedProgress, error: updateError } = await supabase
      .from("onboarding_progress")
      .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
      .select()
      .maybeSingle()

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
