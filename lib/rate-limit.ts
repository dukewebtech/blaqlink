import { createAdminClient } from "@/lib/supabase/server"

/**
 * Fixed-window rate limit stored in Postgres (no extra service needed).
 * Returns true when the action is allowed.
 *
 * failOpen: what to do if the limiter itself is unavailable. Checkout fails
 * open (never lose a sale to a limiter outage); paid lookups such as NIN
 * fail closed (an outage must not become unlimited spending).
 */
export async function allowRequest(key: string, windowSeconds: number, max: number, failOpen: boolean): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max: max,
    })
    if (error) throw error
    return data === true
  } catch (error) {
    console.error("[rate-limit] unavailable:", error instanceof Error ? error.message : error)
    return failOpen
  }
}

/** Best-effort client IP behind Vercel's proxy. */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}
