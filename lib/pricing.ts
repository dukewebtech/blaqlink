import { createAdminClient } from "@/lib/supabase/server"

export interface PricingPlan {
  id: string
  plan_key: string
  name: string
  description: string | null
  monthly_fee: number
  transaction_fee_percentage: number
  transaction_fee_fixed: number
  product_limit: number | null
  allowed_selling_types: string[]
  features: string[]
  is_popular: boolean
  is_active: boolean
  display_order: number
}

// Vendors are backfilled to the Free plan on creation, but fall back here
// defensively in case a vendor row ever has no plan_id set.
export async function getVendorPlan(vendorUserId: string): Promise<PricingPlan> {
  const supabase = createAdminClient()
  const { data: user } = await supabase.from("users").select("plan_id").eq("id", vendorUserId).maybeSingle()

  if (user?.plan_id) {
    const { data: plan } = await supabase.from("pricing_plans").select("*").eq("id", user.plan_id).maybeSingle()
    if (plan) return plan as PricingPlan
  }

  const { data: freePlan } = await supabase.from("pricing_plans").select("*").eq("plan_key", "free").single()
  return freePlan as PricingPlan
}

// Computed once at payment time and stored on the order — never recomputed
// later, so editing a plan's pricing in admin never rewrites past orders.
export function computeOrderFee(
  orderTotal: number,
  plan: Pick<PricingPlan, "transaction_fee_percentage" | "transaction_fee_fixed">,
) {
  const percentageFee = orderTotal * (plan.transaction_fee_percentage / 100)
  const platform_fee_amount = Math.round((percentageFee + plan.transaction_fee_fixed) * 100) / 100

  return {
    platform_fee_percentage: plan.transaction_fee_percentage,
    platform_fee_fixed: plan.transaction_fee_fixed,
    platform_fee_amount,
  }
}
