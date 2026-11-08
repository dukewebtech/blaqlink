import { NextResponse } from "next/server"

// Read at request time, not build time — the point is what the live runtime sees.
export const dynamic = "force-dynamic"

function mode(value: string | undefined) {
  if (!value?.trim()) return "missing"
  if (value !== value.trim()) return "set, but has spaces around it"
  if (value.includes("_live_")) return "live"
  if (value.includes("_test_")) return "test"
  if (value.startsWith("whsec_")) return "set"
  return "set, but unexpected format"
}

// TEMPORARY: shows which deployment is live and whether it can see its keys.
// Reports yes/no and mode only, never a key or any part of one. Remove after launch.
export async function GET() {
  return NextResponse.json(
    {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      deployment: process.env.VERCEL_URL ?? null,
      environment: process.env.VERCEL_ENV ?? null,
      keys: {
        KORA_SECRET_KEY: mode(process.env.KORA_SECRET_KEY),
        PAYSTACK_SECRET_KEY: mode(process.env.PAYSTACK_SECRET_KEY),
        PAYSTACK_WEBHOOK_SECRET: mode(process.env.PAYSTACK_WEBHOOK_SECRET),
        RESEND_API_KEY: process.env.RESEND_API_KEY?.trim() ? "set" : "missing",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ? "set" : "missing",
      },
      // Names only, to catch a misspelled variable
      related_variable_names: Object.keys(process.env).filter((k) => /KORA|PAYSTACK/i.test(k)).sort(),
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
