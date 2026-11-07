import { createAdminClient, createServerClient } from "@/lib/supabase/server"
import { getBankCode, resolveBankAccount } from "@/lib/korapay"
import { namesMatch } from "@/lib/payouts"
import { NextResponse } from "next/server"
import { generateUniqueSlug } from "@/lib/utils/slug"

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
        // The client sends its own slugified guess, but it never checked whether
        // that slug was already taken — resolve it to a guaranteed-unique one
        // here (appending -2, -3, ... on collision) rather than trusting it.
        const resolvedSlug = await generateUniqueSlug(stepData.storeSlug || stepData.businessName, user.id)

        progressUpdates.business_info_completed = true
        progressUpdates.store_setup_completed   = true
        progressUpdates.onboarding_completed    = true
        progressUpdates.store_slug              = resolvedSlug
        progressUpdates.store_city              = stepData.city
        progressUpdates.store_state             = stepData.state

        const { error: userUpdateError } = await supabase.from("users").update({
          business_name:   stepData.businessName,
          store_name:      stepData.businessName,
          store_slug:      resolvedSlug,
          business_category: stepData.businessCategory,
          store_city:      stepData.city,
          store_state:     stepData.state,
          store_logo_url:  stepData.storeLogo || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }).eq("auth_id", user.id)

        if (userUpdateError) {
          console.error("[onboarding/POST] users update error:", userUpdateError)
          return NextResponse.json({ error: "Failed to save your store details. Please try again." }, { status: 500 })
        }
        break
      }

      // ── KYC / Identity Verification ────────────────────────────────────────
      // Verification itself happens in /api/kyc/nin. This step used to mark the
      // account verified with whatever name the browser sent, so it now only
      // records progress for accounts that really are verified.
      case "kyc": {
        const { data: me } = await createAdminClient()
          .from("users").select("payout_verified").eq("auth_id", user.id).maybeSingle()
        if (!me?.payout_verified) {
          return NextResponse.json({ error: "Verify your NIN first." }, { status: 403 })
        }
        progressUpdates.kyc_info_completed = true
        break
      }

      // ── Bank Account / Payout Setup ─────────────────────────────────────────
      // Payouts go to this account, so the name is resolved here with Korapay
      // rather than trusting the one the browser sends, and must match the
      // NIN-verified legal name when there is one.
      case "bank": {
        const accountNumber = String(stepData?.accountNumber ?? "")
        const bankCode = getBankCode(String(stepData?.bankName ?? ""))
        if (!bankCode || !/^\d{10}$/.test(accountNumber)) {
          return NextResponse.json({ error: "Choose your bank and enter a 10-digit account number." }, { status: 400 })
        }
        const resolved = await resolveBankAccount(bankCode, accountNumber)
        const accountName: string = resolved?.data?.account_name ?? ""
        if (!resolved?.status || !accountName) {
          return NextResponse.json({ error: "We couldn't verify that account. Check the number and bank." }, { status: 400 })
        }

        const adminClient = createAdminClient()
        const { data: me } = await adminClient
          .from("users").select("legal_name").eq("auth_id", user.id).maybeSingle()
        if (me?.legal_name && !namesMatch(accountName, me.legal_name)) {
          return NextResponse.json(
            { error: "This account isn't in the name on your verified NIN. Use a bank account in your own name." },
            { status: 422 },
          )
        }

        const { error: bankError } = await adminClient.from("users").update({
          bank_name:      stepData.bankName,
          account_number: accountNumber,
          account_name:   accountName,
          updated_at: new Date().toISOString(),
        }).eq("auth_id", user.id)
        if (bankError) {
          console.error("[onboarding/POST] bank save error:", bankError.message)
          return NextResponse.json({ error: "Failed to save bank information. Please try again." }, { status: 500 })
        }
        progressUpdates.bank_info_completed = true
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
