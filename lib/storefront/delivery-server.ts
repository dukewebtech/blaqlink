import { createAdminClient } from "@/lib/supabase/server"
import type { DeliveryArea } from "@/lib/storefront/delivery"

/** Server-only: reads a vendor's configured delivery areas. Don't import from client components. */
export async function getDeliveryAreas(vendorUserId: string): Promise<DeliveryArea[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("delivery_areas")
    .select("id, name, note, fee, state, city")
    .eq("user_id", vendorUserId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[storefront/delivery-server] Failed to load delivery areas:", error.message)
    return []
  }
  return (data ?? []).map((row) => ({ ...row, fee: Number(row.fee) }))
}
