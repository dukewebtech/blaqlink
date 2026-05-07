import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let { data: progress } = await supabase
      .from("onboarding_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!progress) {
      const { data: newProgress, error: createError } = await supabase
        .from("onboarding_progress")
        .insert({ user_id: user.id })
        .select()
        .maybeSingle()

      if (createError) {
        return NextResponse.json({
          progress: { user_id: user.id, onboarding_completed: false },
        })
      }
      progress = newProgress
    }

    return NextResponse.json({ progress })
  } catch (error) {
    console.error("[onboarding/GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { step, data: stepData } = body

    const progressUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    switch (step) {
      // ── Step 1: Store Setup (the single onboarding gate) ──────────────────
      case 1: {
        progressUpdates.business_info_completed = true
        progressUpdates.store_setup_completed   = true
        progressUpdates.onboarding_completed    = true
        progressUpdates.store_slug              = stepData.storeSlug
        progressUpdates.store_city              = stepData.city
        progressUpdates.store_state             = stepData.state

        await supabase.from("users").update({
          business_name:   stepData.businessName,
          store_name:      stepData.businessName,
          store_slug:      stepData.storeSlug,
          business_category: stepData.businessCategory,
          store_city:      stepData.city,
          store_state:     stepData.state,
          store_logo_url:  stepData.storeLogo || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }).eq("id", user.id)
        break
      }

      // ── KYC / Identity Verification ────────────────────────────────────────
      case "kyc": {
        progressUpdates.kyc_info_completed = true

        await supabase.from("users").update({
          legal_name:    stepData.legalName,
          full_name:     stepData.legalName,
          date_of_birth: stepData.dateOfBirth,
          kyc_status:    "verified",
          payout_verified: true,
          updated_at: new Date().toISOString(),
        }).eq("id", user.id)
        break
      }

      // ── Bank Account / Payout Setup ─────────────────────────────────────────
      case "bank": {
        progressUpdates.bank_info_completed = true

        await supabase.from("users").update({
          bank_name:      stepData.bankName,
          account_number: stepData.accountNumber,
          account_name:   stepData.accountName,
          updated_at: new Date().toISOString(),
        }).eq("id", user.id)
        break
      }

      // ── Checklist item updates ─────────────────────────────────────────────
      case "checklist_store_customized":
        progressUpdates.checklist_store_customized = true
        break

      case "checklist_store_shared":
        progressUpdates.checklist_store_shared = true
        break
    }

    const { data: updated, error: upsertError } = await supabase
      .from("onboarding_progress")
      .upsert({ user_id: user.id, ...progressUpdates }, { onConflict: "user_id" })
      .select()
      .maybeSingle()

    if (upsertError) {
      console.error("[onboarding/POST] upsert error:", upsertError)
      return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
    }

    return NextResponse.json({ progress: updated })
  } catch (error) {
    console.error("[onboarding/POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
