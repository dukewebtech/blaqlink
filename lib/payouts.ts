import { createAdminClient } from "@/lib/supabase/server"

function normalize(name: string) {
  return name.toUpperCase().replace(/[^A-Z\s]/g, " ").replace(/\s+/g, " ").trim()
}

/** Same rule the payout settings page shows the vendor: at least half the words match. */
export function namesMatch(a: string, b: string): boolean {
  const words = normalize(a).split(" ").filter(Boolean)
  const target = normalize(b)
  if (words.length === 0 || !target) return false
  const matchCount = words.filter((w) => target.includes(w)).length
  return matchCount / words.length >= 0.5
}

/**
 * What a vendor can withdraw right now: paid orders net of fees, minus fees
 * kept on refunded orders, minus every withdrawal that isn't rejected or
 * failed. Calculated in the database (vendor_available_balance) — the same
 * function the withdrawal lock uses — so screens and payouts can't disagree.
 */
export async function getAvailableBalance(vendorUserId: string): Promise<number> {
  const { data, error } = await createAdminClient().rpc("vendor_available_balance", { p_user: vendorUserId })
  if (error) throw new Error(`Balance unavailable: ${error.message}`)
  return Number(data ?? 0)
}
