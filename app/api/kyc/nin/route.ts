import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
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
    const { nin, fullName, dateOfBirth } = await req.json()

    if (!nin || !fullName || !dateOfBirth) {
      return NextResponse.json({ error: "NIN, full name, and date of birth are required." }, { status: 400 })
    }

    let ninName: string
    let ninDob: string

    if (isTestKey && nin === TEST_NIN) {
      // Test-mode bypass: accept any name/DOB supplied by the user
      ninName = fullName.trim()
      ninDob = dateOfBirth.trim()
    } else {
      const result = await lookupNIN(nin)
      console.log("[kyc/nin] KoraPay response:", JSON.stringify(result))

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
      const last = ninData.lastname ?? ninData.last_name ?? ""
      ninName = ninData.full_name ?? `${first} ${last}`.trim()
      // KoraPay returns DOB in various formats — normalise to YYYY-MM-DD
      ninDob = (ninData.date_of_birth ?? ninData.dob ?? "").split("T")[0]
    }

    if (!wordsMatch(fullName, ninName)) {
      return NextResponse.json(
        {
          error: `The name you entered ("${fullName}") does not match the name on your NIN ("${ninName}"). At least half of your name words must match.`,
        },
        { status: 422 },
      )
    }

    if (!dobMatch(dateOfBirth, ninDob)) {
      return NextResponse.json(
        {
          error: `The date of birth you entered (${dateOfBirth}) does not match the date of birth on your NIN (${ninDob}). Please enter the exact date of birth registered on your NIN.`,
        },
        { status: 422 },
      )
    }

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Save verified name + mark payout_verified
    await supabase
      .from("users")
      .update({ legal_name: ninName, payout_verified: true })
      .eq("id", user.id)

    // Mark KYC completed in onboarding_progress
    await supabase
      .from("onboarding_progress")
      .update({ kyc_info_completed: true })
      .eq("user_id", user.id)

    return NextResponse.json({ success: true, verifiedName: ninName })
  } catch (err: any) {
    console.error("[kyc/nin]", err)
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 })
  }
}
