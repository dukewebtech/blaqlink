import { type NextRequest, NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"
import { safeNext } from "@/lib/utils/safe-next"

const TYPES: EmailOtpType[] = ["email", "signup", "recovery", "email_change", "magiclink", "invite"]

/**
 * Link in our confirmation and reset emails:
 *   /auth/confirm?token_hash=…&type=email|recovery&next=/onboarding
 * Verifies on the server, so it works even when the email app opens the
 * link in a different browser from the one used to sign up.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const tokenHash = url.searchParams.get("token_hash")
  const type = url.searchParams.get("type") as EmailOtpType | null
  const next = safeNext(url.searchParams.get("next"), type === "recovery" ? "/reset-password" : "/onboarding")

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
    console.error("[auth/confirm] verify failed:", error.message)
  }

  const fallback = type === "recovery" ? "/reset-password" : "/login?link=expired"
  return NextResponse.redirect(new URL(fallback, url.origin))
}
