import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/utils/api-helpers"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Accepts the scanned QR text (a ticket URL) or a typed code / code prefix. */
function extractCode(input: string): { code?: string; prefix?: string } {
  const value = input.trim()
  const fromUrl = value.match(/\/tickets\/([0-9a-f]{32})/i)?.[1]
  if (fromUrl) return { code: fromUrl.toLowerCase() }
  if (/^[0-9a-f]{32}$/i.test(value)) return { code: value.toLowerCase() }
  if (/^[0-9a-f]{8}$/i.test(value)) return { prefix: value.toLowerCase() }
  return {}
}

// Event check-in: counts per event (GET) and one-time admission (POST).
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser()
  if (!auth.success) return auth.error
  const productId = request.nextUrl.searchParams.get("productId")
  if (!productId || !UUID_RE.test(productId)) return NextResponse.json({ error: "Choose an event" }, { status: 400 })

  const supabase = createAdminClient()
  const { data: product } = await supabase.from("products").select("id").eq("id", productId).eq("user_id", auth.user.userId).maybeSingle()
  if (!product) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  const [{ count: total }, { count: used }] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("product_id", productId).neq("status", "cancelled"),
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("product_id", productId).eq("status", "used"),
  ])
  return NextResponse.json({ total: total ?? 0, checkedIn: used ?? 0 })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser()
  if (!auth.success) return auth.error

  const body = await request.json().catch(() => null)
  const productId = typeof body?.productId === "string" && UUID_RE.test(body.productId) ? body.productId : null
  const { code, prefix } = extractCode(String(body?.code ?? ""))
  if (!code && !prefix) return NextResponse.json({ result: "invalid", message: "That isn't a Blaqora ticket code." })

  const supabase = createAdminClient()
  let ticketCode = code
  if (!ticketCode && prefix) {
    // 8-character short code printed under the QR, scoped to this vendor
    const { data: matches } = await supabase.from("tickets").select("code").eq("vendor_id", auth.user.userId).like("code", `${prefix}%`).limit(2)
    if (!matches?.length) return NextResponse.json({ result: "not_found", message: "No ticket with that code." })
    if (matches.length > 1) return NextResponse.json({ result: "invalid", message: "Scan the QR code instead. That short code matches more than one ticket." })
    ticketCode = matches[0].code
  }

  const { data, error } = await supabase.rpc("check_in_ticket", { p_code: ticketCode, p_vendor: auth.user.userId, p_product: productId })
  if (error) {
    console.error("[check-in] failed:", error.message)
    return NextResponse.json({ error: "Check-in failed. Try again." }, { status: 500 })
  }

  const ticket = data?.ticket
  let holder: string | null = null
  let tier: string | null = null
  if (ticket) {
    holder = ticket.holder_name
    if (ticket.ticket_tier_id) {
      const { data: t } = await supabase.from("ticket_tiers").select("name").eq("id", ticket.ticket_tier_id).maybeSingle()
      tier = t?.name ?? null
    }
  }
  return NextResponse.json({ result: data?.result, holder, tier, checkedInAt: ticket?.checked_in_at ?? null })
}
