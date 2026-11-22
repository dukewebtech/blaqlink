import { createAdminClient } from "@/lib/supabase/server"
import { getVendorPlan } from "@/lib/pricing"
import { normaliseProductInput, validateProduct, type ProductErrors, type ProductInput } from "@/lib/products/schema"

export type SaveProductResult =
  | { ok: true; product: Record<string, unknown> }
  | { ok: false; status: number; message: string; errors?: ProductErrors }

const PLAN_TYPE_LABELS: Record<string, string> = {
  digital: "digital products",
  event: "event tickets",
  physical: "physical products",
  appointment: "bookings",
}

/**
 * Validates and saves a product with its ticket tiers and variants in one
 * database transaction (save_product). The vendor id comes from the session,
 * never from the request body.
 */
export async function saveProduct(vendorId: string, productId: string | null, raw: Record<string, unknown>): Promise<SaveProductResult> {
  const input: ProductInput = normaliseProductInput(raw)
  const errors = validateProduct(input)
  if (Object.keys(errors).length > 0) {
    return { ok: false, status: 400, message: Object.values(errors)[0] ?? "Check the highlighted fields.", errors }
  }

  // Paid files must be ones this vendor uploaded (their own storage folder).
  if (input.file_urls.some((u) => !u.startsWith(`digital-files:${vendorId}/`))) {
    const message = "One of the files didn't upload properly. Remove it and upload it again."
    return { ok: false, status: 400, message, errors: { file_urls: message } }
  }

  const plan = await getVendorPlan(vendorId)
  if (!plan.allowed_selling_types.includes(input.product_type)) {
    return {
      ok: false,
      status: 403,
      message: `Your ${plan.name} plan doesn't include ${PLAN_TYPE_LABELS[input.product_type]}. Change your plan to sell these.`,
    }
  }

  const supabase = createAdminClient()

  if (!productId && plan.product_limit !== null) {
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("user_id", vendorId)
    if ((count ?? 0) >= plan.product_limit) {
      return { ok: false, status: 403, message: `Your ${plan.name} plan allows up to ${plan.product_limit} products. Change your plan to add more.` }
    }
  }

  if (input.category) {
    const { data: category } = await supabase.from("categories").select("id").eq("id", input.category).eq("user_id", vendorId).maybeSingle()
    if (!category) return { ok: false, status: 400, message: "Choose a category from the list.", errors: { category: "Choose a category from the list." } }
  }

  const { ticket_tiers, variants, ...product } = input
  const { data, error } = await supabase.rpc("save_product", {
    p_vendor: vendorId,
    p_product_id: productId,
    p_product: product,
    p_tiers: ticket_tiers,
    p_variants: variants,
  })

  if (error) {
    console.error("[products] save_product failed:", error.message)
    return { ok: false, status: 500, message: "We couldn't save this product. Please try again." }
  }
  if (!data?.ok) return { ok: false, status: data?.status ?? 400, message: data?.message ?? "We couldn't save this product." }
  return { ok: true, product: data.product }
}

/** A vendor's product with its tiers and variants, for the edit form. */
export async function getVendorProduct(vendorId: string, productId: string) {
  const supabase = createAdminClient()
  const { data: product } = await supabase.from("products").select("*").eq("id", productId).eq("user_id", vendorId).maybeSingle()
  if (!product) return null
  const [{ data: tiers }, { data: variants }] = await Promise.all([
    supabase.from("ticket_tiers").select("id, name, price, quantity_total, quantity_sold").eq("product_id", productId).order("sort_order"),
    supabase.from("product_variants").select("id, size, color_name, color_hex, stock_quantity").eq("product_id", productId).order("created_at"),
  ])
  return { ...product, ticket_tiers: tiers ?? [], variants: variants ?? [] }
}
