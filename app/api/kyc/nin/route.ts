import { NextResponse } from "next/server"
import { createAdminClient, createServerClient } from "@/lib/supabase/server"
import { lookupNIN } from "@/lib/korapay"
import { allowRequest } from "@/lib/rate-limit"
import { compareNinDetails, mismatchMessage, nameWords, type NinRecord } from "@/lib/kyc/nin-match"

// KoraPay sandbox does not expose a live NIN database.
// Use NIN "00000000000" in test mode to simulate a successful lookup.
const TEST_NIN = "00000000000"
const isTestKey = (process.env.KORA_SECRET_KEY ?? "").startsWith("sk_test_")

export async function POST(req: Request) {
  try {
    // Auth first — every lookup is billed to our Korapay balance
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const nin = String(body.nin ?? "").trim()
    const firstName = String(body.firstName ?? "").trim()
    const middleName = String(body.middleName ?? "").trim()
    const lastName = String(body.lastName ?? "").trim()
    const dateOfBirth = String(body.dateOfBirth ?? "").trim()

    if (!nin || !dateOfBirth) {
      return NextResponse.json({ error: "Enter your NIN and date of birth." }, { status: 400 })
    }
    if (nameWords(firstName).length === 0) {
      return NextResponse.json({ error: "Enter your first name." }, { status: 400 })
    }
    if (nameWords(lastName).length === 0) {
      return NextResponse.json({ error: "Enter your surname." }, { status: 400 })
    }

    if (!/^\d{11}$/.test(String(nin))) {
      return NextResponse.json({ error: "Your NIN should be 11 digits." }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from("users")
      .select("payout_verified")
      .eq("auth_id", user.id)
      .maybeSingle()
    if (profile?.payout_verified) {
      return NextResponse.json({ error: "Your identity is already verified." }, { status: 409 })
    }

    // Each lookup is billed; cap retries per vendor (fails closed).
    if (!(await allowRequest(`nin:${user.id}`, 24 * 60 * 60, 5, false))) {
      return NextResponse.json(
        { error: "You've tried several times today. Check the details on your NIN slip and try again tomorrow, or contact support." },
        { status: 429 },
      )
    }

    // Without this check, a missing key made koraFetch() throw and this whole route
    // fall into the generic catch-all below with no indication of why.
    if (!process.env.KORA_SECRET_KEY) {
      console.error("[kyc/nin] KORA_SECRET_KEY is not set")
      return NextResponse.json(
        { error: "Identity verification is not configured yet. Please contact support." },
        { status: 500 },
      )
    }

    let record: NinRecord

    if (isTestKey && nin === TEST_NIN) {
      // Test-mode bypass: the record is whatever was typed
      record = { firstName, middleName, lastName, fullName: "", dateOfBirth }
    } else {
      let result: any
      try {
        result = await lookupNIN(nin)
      } catch (lookupErr: any) {
        console.error("[kyc/nin] lookupNIN threw:", lookupErr)
        return NextResponse.json(
          { error: "We couldn't reach the identity service. Please try again in a few minutes." },
          { status: 502 },
        )
      }
      // Never log the response body — it holds the person's name, DOB and photo
      console.log("[kyc/nin] KoraPay response status:", result?.status, result?.message)

      if (!result?.data) {
        const msg = result?.message ?? result?.error ?? "NIN lookup failed."
        return NextResponse.json(
          {
            error: isTestKey
              ? `KoraPay test NIN lookup: ${msg}. Use NIN "00000000000" to test in sandbox mode.`
              : "We couldn't find that NIN. Check the 11 digits on your NIN slip and try again.",
          },
          { status: 400 },
        )
      }

      const d = result.data
      record = {
        firstName: d.firstname ?? d.first_name ?? "",
        middleName: d.middlename ?? d.middle_name ?? "",
        lastName: d.lastname ?? d.last_name ?? d.surname ?? "",
        fullName: d.full_name ?? "",
        dateOfBirth: d.date_of_birth ?? d.dob ?? d.birthdate ?? "",
      }
    }

    // Says which field is wrong, never what the record holds.
    const wrong = compareNinDetails({ firstName, middleName, lastName }, dateOfBirth, record)
    if (wrong.length > 0) {
      return NextResponse.json({ error: mismatchMessage(wrong), fields: wrong }, { status: 422 })
    }

    const ninName =
      record.fullName.trim() || [record.firstName, record.middleName, record.lastName].map((x) => x.trim()).filter(Boolean).join(" ")

    // Save verified name + mark payout_verified
    // Filters by auth_id, not id — public.users.id is its own generated key
    // that only coincidentally matches the auth UUID for most rows; some
    // legacy accounts (including at least one real vendor) have it diverge,
    // which silently no-ops an .eq("id", ...) update with zero indication.
    // Admin client: these columns are server-only (see scripts/055)
    const { error: saveError } = await adminClient
      .from("users")
      .update({ legal_name: ninName, payout_verified: true })
      .eq("auth_id", user.id)
    if (saveError) {
      console.error("[kyc/nin] Failed to save verification:", saveError.message)
      return NextResponse.json({ error: "Verified, but we couldn't save it. Please try again." }, { status: 500 })
    }

    // Mark KYC completed in onboarding_progress
    await adminClient
      .from("onboarding_progress")
      .update({ kyc_info_completed: true })
      .eq("user_id", user.id)

    return NextResponse.json({ success: true, verifiedName: ninName })
  } catch (err: any) {
    console.error("[kyc/nin]", err)
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 })
  }
}
