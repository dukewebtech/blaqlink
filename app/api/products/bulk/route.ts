import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, handleApiError } from "@/lib/utils/api-helpers"

const VALID_STATUSES = ["draft", "published", "archived"] as const
type Status = (typeof VALID_STATUSES)[number]

// Columns copied verbatim when duplicating a product. Excludes id/timestamps
// (new row gets its own) and anything that shouldn't carry over to a fresh
// listing (status is forced to draft so a duplicate never goes live silently).
const DUPLICATE_COLUMNS = [
  "product_type",
  "title",
  "description",
  "price",
  "compare_at_price",
  "category",
  "images",
  "file_urls",
  "license_type",
  "download_limit",
  "event_date",
  "event_location",
  "is_paid_ticket",
  "ticket_types",
  "total_capacity",
  "sku",
  "stock_quantity",
  "is_automated_delivery",
  "logistics_api_key",
  "shipping_locations",
  "duration_minutes",
  "available_days",
  "time_slots",
  "start_time",
  "end_time",
  "booking_link",
] as const

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser()
    if (!authResult.success) {
      return authResult.error
    }
    const userId = authResult.user.userId

    const body = await request.json()
    const action = body.action as string
    const ids = Array.isArray(body.ids) ? (body.ids as string[]).filter((id) => typeof id === "string" && id) : []

    if (ids.length === 0) {
      return NextResponse.json({ error: "No products selected" }, { status: 400 })
    }

    const supabase = await createServerClient()

    switch (action) {
      case "status": {
        const status = body.status as string
        if (!VALID_STATUSES.includes(status as Status)) {
          return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }
        const { data, error } = await supabase
          .from("products")
          .update({ status })
          .eq("user_id", userId)
          .in("id", ids)
          .select("id")

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ updated: (data ?? []).map((r) => r.id) })
      }

      case "delete": {
        // One delete per id (not a single batched statement) so a product
        // blocked by a foreign key (e.g. it has real orders) doesn't stop
        // the rest of the batch from deleting.
        const deleted: string[] = []
        const failed: { id: string; reason: string }[] = []
        for (const id of ids) {
          const { error, count } = await supabase
            .from("products")
            .delete({ count: "exact" })
            .eq("user_id", userId)
            .eq("id", id)
          if (error) failed.push({ id, reason: error.message })
          else if (!count) failed.push({ id, reason: "Not found" })
          else deleted.push(id)
        }
        return NextResponse.json({ deleted, failed })
      }

      case "stock": {
        const mode = body.mode as string
        if (mode !== "set" && mode !== "out_of_stock") {
          return NextResponse.json({ error: "Invalid stock mode" }, { status: 400 })
        }
        let quantity = 0
        if (mode === "set") {
          quantity = Number(body.quantity)
          if (!Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
            return NextResponse.json({ error: "Quantity must be a whole number of 0 or more" }, { status: 400 })
          }
        }

        const { data: targets, error: fetchError } = await supabase
          .from("products")
          .select("id, title, product_type")
          .eq("user_id", userId)
          .in("id", ids)
        if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

        const physicalIds = (targets ?? []).filter((p) => p.product_type === "physical").map((p) => p.id)
        const { data: variantRows } = physicalIds.length
          ? await supabase.from("product_variants").select("product_id").in("product_id", physicalIds)
          : { data: [] as { product_id: string }[] }
        const idsWithVariants = new Set((variantRows ?? []).map((v) => v.product_id))

        const skipped: { id: string; title: string; reason: string }[] = []
        const eligibleIds: string[] = []
        for (const p of targets ?? []) {
          if (p.product_type !== "physical") {
            skipped.push({ id: p.id, title: p.title, reason: "Not a physical product" })
          } else if (idsWithVariants.has(p.id)) {
            skipped.push({ id: p.id, title: p.title, reason: "Has size/colour variants — edit those directly" })
          } else {
            eligibleIds.push(p.id)
          }
        }

        let updated: string[] = []
        if (eligibleIds.length) {
          const { data, error } = await supabase
            .from("products")
            .update({ stock_quantity: quantity })
            .eq("user_id", userId)
            .in("id", eligibleIds)
            .select("id")
          if (error) return NextResponse.json({ error: error.message }, { status: 500 })
          updated = (data ?? []).map((r) => r.id)
        }

        return NextResponse.json({ updated, skipped })
      }

      case "category": {
        const categoryId = body.categoryId === null ? null : (body.categoryId as string)

        const { data: targets, error: fetchError } = await supabase
          .from("products")
          .select("id, product_type")
          .eq("user_id", userId)
          .in("id", ids)
        if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
        if (!targets || targets.length === 0) {
          return NextResponse.json({ error: "No matching products" }, { status: 404 })
        }

        const distinctTypes = new Set(targets.map((p) => p.product_type))
        if (distinctTypes.size > 1) {
          return NextResponse.json(
            { error: "Selected products must all be the same type to assign a category" },
            { status: 400 },
          )
        }

        if (categoryId) {
          const { data: category, error: categoryError } = await supabase
            .from("categories")
            .select("id, product_type")
            .eq("user_id", userId)
            .eq("id", categoryId)
            .single()
          if (categoryError || !category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 })
          }
          const [selectedType] = distinctTypes
          if (category.product_type !== selectedType) {
            return NextResponse.json({ error: "That category doesn't match the selected products' type" }, { status: 400 })
          }
        }

        // Category assignment is stored in the `category` text column
        // (holds the category's UUID as a string) — the same convention the
        // product create/edit forms already use; `category_id` is unused.
        const { data, error } = await supabase
          .from("products")
          .update({ category: categoryId })
          .eq("user_id", userId)
          .in("id", ids)
          .select("id")

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ updated: (data ?? []).map((r) => r.id) })
      }

      case "duplicate": {
        const { data: sourceProducts, error: fetchError } = await supabase
          .from("products")
          .select(DUPLICATE_COLUMNS.join(","))
          .eq("user_id", userId)
          .in("id", ids)
        if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
        if (!sourceProducts || sourceProducts.length === 0) {
          return NextResponse.json({ error: "No matching products" }, { status: 404 })
        }

        const inserted: { newId: string; sourceId: string }[] = []
        for (let i = 0; i < ids.length; i++) {
          const id = ids[i]
          const source = sourceProducts[i] as any
          if (!source) continue

          const { data: newProduct, error: insertError } = await supabase
            .from("products")
            .insert({
              ...source,
              user_id: userId,
              title: `${source.title} (Copy)`,
              status: "draft",
            })
            .select("id")
            .single()
          if (insertError || !newProduct) continue
          inserted.push({ newId: newProduct.id, sourceId: id })

          const { data: variants } = await supabase
            .from("product_variants")
            .select("size, color_name, color_hex, stock_quantity, sku")
            .eq("product_id", id)
          if (variants && variants.length > 0) {
            await supabase
              .from("product_variants")
              .insert(variants.map((v) => ({ ...v, product_id: newProduct.id })))
          }

          const { data: tiers } = await supabase
            .from("ticket_tiers")
            .select("name, price, quantity_total, sort_order")
            .eq("product_id", id)
          if (tiers && tiers.length > 0) {
            await supabase
              .from("ticket_tiers")
              .insert(tiers.map((t) => ({ ...t, product_id: newProduct.id, quantity_sold: 0 })))
          }
        }

        return NextResponse.json({ created: inserted.map((r) => r.newId) })
      }

      default:
        return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 })
    }
  } catch (error) {
    return handleApiError(error, "POST /api/products/bulk")
  }
}
