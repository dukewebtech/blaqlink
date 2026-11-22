import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { safeNext } from "@/lib/utils/safe-next"

/**
 * Fallback for emails that still use Supabase's default link (?code=…).
 * That only works in the same browser the person signed up in; our own
 * email templates use /auth/confirm instead.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get("code")
  const next = safeNext(url.searchParams.get("next"))

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
    console.error("[auth/callback] exchange failed:", error.message)
  }
  return NextResponse.redirect(new URL(next === "/reset-password" ? "/reset-password" : "/login?link=expired", url.origin))
}
