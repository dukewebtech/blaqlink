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

// Mirrors the Payouts page: net of fees from paid orders, minus every
// withdrawal that isn't rejected/failed. Server-side so the limit can't be
// skipped by calling the API directly.
export async function getAvailableBalance(vendorUserId: string): Promise<number> {
  const supabase = createAdminClient()

  const [{ data: orders }, { data: withdrawals }, { data: settings }] = await Promise.all([
    supabase.from("orders").select("payment_status, total_amount, platform_fee_amount").eq("user_id", vendorUserId),
    supabase.from("withdrawal_requests").select("amount, status").eq("user_id", vendorUserId),
    supabase.from("platform_settings").select("commission_percentage").maybeSingle(),
  ])

  const fallbackCommissionRate = settings?.commission_percentage || 10
  const net = (orders ?? [])
    .filter((o) => o.payment_status === "paid" || o.payment_status === "success")
    .reduce((sum, o) => {
      const total = Number(o.total_amount || 0)
      const fee = o.platform_fee_amount ?? (total * fallbackCommissionRate) / 100
      return sum + total - Number(fee)
    }, 0)

  const committed = (withdrawals ?? [])
    .filter((w) => w.status !== "rejected" && w.status !== "failed")
    .reduce((sum, w) => sum + Number(w.amount || 0), 0)

  return Math.round((net - committed) * 100) / 100
}
