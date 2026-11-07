import { NextResponse } from "next/server"
import { createAdminClient, createServerClient } from "@/lib/supabase/server"
import { lookupNIN } from "@/lib/korapay"

function normalize(name: string) {
  return name.toUpperCase().replace(/\s+/g, " ").trim()
}

function wordsMatch(entered: string, returned: string): boolean {
  const words = normalize(entered).split(" ").filter(Boolean)
  const target = normalize(returned)
  const matchCount = words.filter((w) => target.includes(w)).length
  return matchCount / words.length >= 0.5
}

function dobMatch(entered: string, returned: string): boolean {
  return entered.trim() === returned.trim()
}

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

    const { nin, fullName, dateOfBirth } = await req.json()

    if (!nin || !fullName || !dateOfBirth) {
      return NextResponse.json({ error: "NIN, full name, and date of birth are required." }, { status: 400 })
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

    // Same check app/api/payment/korapay/initialize/route.ts already does —
    // without it, a missing key made koraFetch() throw and this whole route
    // fall into the generic catch-all below with no indication of why.
    if (!process.env.KORA_SECRET_KEY) {
      console.error("[kyc/nin] KORA_SECRET_KEY is not set")
      return NextResponse.json(
        { error: "Identity verification is not configured yet. Please contact support." },
        { status: 500 },
      )
    }

    let ninName: string
    let ninDob: string

    if (isTestKey && nin === TEST_NIN) {
      // Test-mode bypass: accept any name/DOB supplied by the user
      ninName = fullName.trim()
      ninDob = dateOfBirth.trim()
    } else {
      let result: any
      try {
        result = await lookupNIN(nin)
      } catch (lookupErr: any) {
        // Surfaces the real reason (network failure, malformed response,
        // etc.) instead of letting it fall through to the generic message.
        console.error("[kyc/nin] lookupNIN threw:", lookupErr)
        return NextResponse.json(
          { error: `Could not reach the identity verification service: ${lookupErr?.message || "unknown error"}.` },
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
              : `NIN verification failed: ${msg}`,
          },
          { status: 400 },
        )
      }

      const ninData = result.data
      const first = ninData.firstname ?? ninData.first_name ?? ""
      const middle = ninData.middlename ?? ninData.middle_name ?? ""
      const last = ninData.lastname ?? ninData.last_name ?? ""
      ninName = ninData.full_name ?? [first, middle, last].filter(Boolean).join(" ")
      // KoraPay returns DOB in various formats — normalise to YYYY-MM-DD
      ninDob = (ninData.date_of_birth ?? ninData.dob ?? "").split("T")[0]
    }

    // Deliberately vague: echoing the record's name or DOB would let anyone
    // look up a stranger's details by guessing a NIN.
    if (!wordsMatch(fullName, ninName) || !dobMatch(dateOfBirth, ninDob)) {
      return NextResponse.json(
        {
          error:
            "The name or date of birth you entered doesn't match the details on this NIN. Enter them exactly as they appear on your NIN slip.",
        },
        { status: 422 },
      )
    }

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
