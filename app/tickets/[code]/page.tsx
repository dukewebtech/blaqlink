import type { Metadata } from "next"
import { notFound } from "next/navigation"
import QRCode from "qrcode"
import { createAdminClient } from "@/lib/supabase/server"
import { getAppUrl } from "@/lib/utils/app-url"
import { formatEventDate } from "@/lib/dates"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Your ticket | Blaqora", robots: { index: false, follow: false } }

const CODE_RE = /^[0-9a-f]{32}$/
const checkedFormat = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })

// What the buyer shows at the entrance. The QR encodes this page's URL; the
// vendor's check-in screen reads the code from it and admits it once.
export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!CODE_RE.test(code)) notFound()

  const supabase = createAdminClient()
  const { data: ticket } = await supabase
    .from("tickets")
    .select("code, seq, status, checked_in_at, holder_name, order_item_id, products(title, event_date, event_location), ticket_tiers(name), users!tickets_vendor_id_fkey(business_name, full_name)")
    .eq("code", code)
    .maybeSingle()
  if (!ticket) notFound()

  const { count } = await supabase.from("tickets").select("id", { count: "exact", head: true }).eq("order_item_id", ticket.order_item_id)
  const product = ticket.products as unknown as { title: string; event_date: string | null; event_location: string | null } | null
  const tier = ticket.ticket_tiers as unknown as { name: string } | null
  const vendor = ticket.users as unknown as { business_name: string | null; full_name: string | null } | null
  const svg = await QRCode.toString(`${getAppUrl()}/tickets/${code}`, { type: "svg", margin: 1, errorCorrectionLevel: "M" })

  const statusCopy =
    ticket.status === "used"
      ? { label: "Already used", detail: ticket.checked_in_at ? `Checked in ${checkedFormat.format(new Date(ticket.checked_in_at))}` : "Checked in", tone: "var(--bq-danger)" }
      : ticket.status === "cancelled"
        ? { label: "Cancelled", detail: "This ticket was refunded and can't be used.", tone: "var(--bq-danger)" }
        : { label: "Valid", detail: "Show this code at the entrance. It works once.", tone: "var(--bq-success)" }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bq-bg-soft)", padding: "var(--bq-space-8) var(--bq-gutter)" }}>
      <article
        className="bq-card bq-card--raised"
        style={{ maxWidth: 420, margin: "0 auto", textAlign: "center", display: "grid", gap: "var(--bq-space-4)" }}
        aria-labelledby="ticket-title"
      >
        <p className="bq-meta">{vendor?.business_name || vendor?.full_name || "Blaqora event"}</p>
        <h1 id="ticket-title" className="bq-h3" style={{ fontSize: "var(--bq-text-title)" }}>
          {product?.title ?? "Event ticket"}
        </h1>
        <p className="bq-small">
          {[product?.event_date ? formatEventDate(product.event_date) : null, product?.event_location].filter(Boolean).join(" · ")}
        </p>
        <div
          aria-label="Ticket QR code"
          role="img"
          style={{ width: "min(100%, 280px)", margin: "0 auto", opacity: ticket.status === "valid" ? 1 : 0.25 }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p style={{ fontWeight: 800, color: statusCopy.tone, fontSize: "var(--bq-text-title)" }}>{statusCopy.label}</p>
        <p className="bq-small">{statusCopy.detail}</p>
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--bq-space-2) var(--bq-space-4)", textAlign: "left" }} className="bq-small">
          <dt>Name</dt>
          <dd style={{ fontWeight: 600 }}>{ticket.holder_name}</dd>
          {tier?.name && (
            <>
              <dt>Ticket</dt>
              <dd style={{ fontWeight: 600 }}>{tier.name}</dd>
            </>
          )}
          {(count ?? 1) > 1 && (
            <>
              <dt>Admission</dt>
              <dd style={{ fontWeight: 600 }}>
                {ticket.seq} of {count}
              </dd>
            </>
          )}
          <dt>Code</dt>
          <dd style={{ fontFamily: "monospace" }}>{code.slice(0, 8).toUpperCase()}</dd>
        </dl>
      </article>
    </main>
  )
}
