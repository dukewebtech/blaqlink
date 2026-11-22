import { createAdminClient } from "@/lib/supabase/server"

export { bankNameMatches as namesMatch } from "@/lib/kyc/nin-match"

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
