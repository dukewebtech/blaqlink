// Email notification system using Resend
// Environment variables required: RESEND_API_KEY, EMAIL_FROM

import { formatNaira } from "@/lib/money"
import { getAppUrl } from "@/lib/utils/app-url"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev"

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

// Send email via Resend API
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email")
    return { success: false, error: "Email not configured" }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[Email] Send failed:", data.message || data)
      return { success: false, error: data.message || "Failed to send email" }
    }

    console.log("[Email] Sent successfully to:", to)
    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("[Email] Error:", error.message)
    return { success: false, error: error.message }
  }
}


// Every string a buyer or vendor typed is escaped before it goes into email
// HTML; subjects are plain text, so they get it back unescaped.
const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c])
}
function escapeDeep<T>(value: T): T {
  if (typeof value === "string") return escapeHtml(value) as T
  if (Array.isArray(value)) return value.map(escapeDeep) as T
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, escapeDeep(v)])) as T
  }
  return value
}
function plainText(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39);/g, (m) => Object.entries(ESCAPES).find(([, e]) => e === m)?.[0] ?? m)
}

// Base email template wrapper
function emailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #000000; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 32px 24px; }
        .footer { background: #f9f9f9; padding: 24px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        .btn { display: inline-block; background: #000; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin: 16px 0; }
        .order-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .order-table th, .order-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .order-table th { background: #f9f9f9; font-weight: 600; }
        .total-row td { font-weight: 600; font-size: 16px; border-top: 2px solid #000; }
        .highlight { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .warning { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        ${content}
        <div class="footer">
          <p>Powered by Blaqora</p>
          <p>If you have questions, please contact the seller directly.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Format currency — ₦ with grouped thousands, per the platform's money format rule.
function formatCurrency(amount: number): string {
  return formatNaira(amount)
}

const APP_URL = getAppUrl()
const DEFAULT_BRAND_COLOR = "#155DFD"
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

interface OrderItem {
  product_title: string
  quantity: number
  price: number
  subtotal: number
  image?: string | null
  product_type?: string | null
  variant_label?: string | null
  ticket_tier_name?: string | null
  appointment_date?: string | null
  appointment_time?: string | null
}

/** "2026-11-29" → "Sat, 29 Nov 2026" (a calendar date, so no time-zone shift). */
function formatAppointmentDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
}

/** "14:00" → "2:00pm" */
function formatAppointmentTime(time: string): string {
  const m = time.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return time
  const h = Number(m[1])
  return `${h % 12 || 12}:${m[2]}${h < 12 ? "am" : "pm"}`
}

function appointmentText(item: OrderItem): string | null {
  if (!item.appointment_date) return null
  return [formatAppointmentDate(item.appointment_date), item.appointment_time ? formatAppointmentTime(item.appointment_time) : null]
    .filter(Boolean)
    .join(" at ")
}

/** Option, ticket type or booking slot shown under an item's name. */
function itemDetail(item: OrderItem): string {
  return [item.variant_label, item.ticket_tier_name, appointmentText(item)].filter(Boolean).join(" &middot; ")
}

/** A vendor's own branding, used to skin the header of order emails so each vendor's mail looks like their store. */
interface VendorBranding {
  name: string
  logoUrl?: string | null
  brandColor?: string | null
  storeSlug?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

function resolveBrandColor(brandColor?: string | null): string {
  return brandColor && HEX_COLOR_RE.test(brandColor) ? brandColor : DEFAULT_BRAND_COLOR
}

function storeUrl(vendor: VendorBranding): string {
  return vendor.storeSlug ? `${APP_URL}/${vendor.storeSlug}` : APP_URL
}

function orderRef(orderId: string): string {
  return `BLQ-${orderId.replace(/-/g, "").slice(0, 6).toUpperCase()}`
}

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  })
}

// A single item row — 64px thumbnail, title + qty, price — shared by both order emails.
function itemRowHtml(item: OrderItem): string {
  const img = item.image || `${APP_URL}/placeholder.svg`
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #F1EEE9;width:64px;">
        <img src="${img}" width="64" height="64" style="width:64px;height:64px;border-radius:10px;object-fit:cover;background:#F1EEE9;" alt="">
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #F1EEE9;vertical-align:top;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#1C1A17;line-height:1.4;">${item.product_title}</p>
        ${itemDetail(item) ? `<p style="margin:4px 0 0;font-size:13px;color:#5C574F;">${itemDetail(item)}</p>` : ""}
        <p style="margin:4px 0 0;font-size:13px;color:#8A857C;">Qty ${item.quantity}</p>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #F1EEE9;vertical-align:top;text-align:right;white-space:nowrap;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#1C1A17;">${formatCurrency(item.subtotal)}</p>
      </td>
    </tr>
  `
}

// Shared "Powered by Blaqora" footer for the branded order emails.
function brandedFooter(note: string): string {
  return `
    <tr><td style="padding:28px 32px;background:#FAF9F6;border-top:1px solid #EEE9E2;" align="center">
      <img src="${APP_URL}/blaqora-wordmark-blue.png" width="72" alt="Blaqora" style="display:block;margin:0 auto 10px;opacity:0.75;">
      <p style="margin:0;font-size:12px;line-height:1.6;color:#9A948B;">${note}</p>
      <p style="margin:4px 0 0;font-size:12px;line-height:1.6;color:#9A948B;">Blaqora &middot; <a href="${APP_URL}" style="color:#9A948B;text-decoration:underline;">blaqora.store</a></p>
    </td></tr>
  `
}

interface VendorOrderEmailParams {
  orderId: string
  createdAt: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerNote?: string | null
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  totalAmount: number
  deliveryAreaName?: string | null
  deliveryAddress?: string | null
  vendor: VendorBranding
}

// Email for vendors when they receive a new order — skinned with the vendor's
// own logo/brand color so it reads as "your store", not a generic system email.
export function getNewOrderEmailForVendor(params: VendorOrderEmailParams): { subject: string; html: string } {
  params = escapeDeep(params)
  const { orderId, createdAt, customerName, customerEmail, customerPhone, customerNote, items, subtotal, deliveryFee, totalAmount, deliveryAreaName, deliveryAddress, vendor } = params
  const accent = resolveBrandColor(vendor.brandColor)
  const logo = vendor.logoUrl || `${APP_URL}/blaqora-icon.png`
  const ref = orderRef(orderId)
  const bookings = items.filter((i) => i.appointment_date)
  const isBooking = bookings.length > 0
  const firstSlot = isBooking ? appointmentText(bookings[0]) : null
  const bookingRows = bookings
    .map(
      (b) => `
        <tr><td style="padding:6px 0;font-size:13px;color:#8A857C;width:110px;vertical-align:top;">Service</td><td style="padding:6px 0;font-size:14px;color:#1C1A17;font-weight:600;">${b.product_title}${b.variant_label ? ` &middot; ${b.variant_label}` : ""}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:#8A857C;vertical-align:top;">Date</td><td style="padding:6px 0;font-size:14px;color:#1C1A17;font-weight:600;">${formatAppointmentDate(b.appointment_date!)}</td></tr>
        ${b.appointment_time ? `<tr><td style="padding:6px 0;font-size:13px;color:#8A857C;vertical-align:top;">Time</td><td style="padding:6px 0;font-size:14px;color:#1C1A17;font-weight:600;">${formatAppointmentTime(b.appointment_time)}</td></tr>` : ""}`,
    )
    .join(`<tr><td colspan="2" style="padding:6px 0;border-bottom:1px solid #EEE9E2;"></td></tr>`)

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
    body{margin:0;padding:0;background:#F1EEE9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
    table{border-collapse:collapse;} img{border:0;display:block;} a{text-decoration:none;}
  </style></head><body>
    <table role="presentation" width="100%" style="background:#F1EEE9;padding:32px 0;"><tr><td align="center">
    <table role="presentation" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <tr><td style="background:${accent};padding:30px 32px;" align="center">
        <img src="${logo}" width="48" height="48" style="width:48px;height:48px;border-radius:50%;border:2px solid rgba(255,255,255,0.6);object-fit:cover;" alt="">
        <p style="margin:12px 0 0;font-size:16px;color:#ffffff;font-weight:700;">${isBooking ? "New booking" : "New order received"}</p>
      </td></tr>

      <tr><td style="padding:32px;">
        <p style="margin:0 0 4px;font-size:15px;color:#1C1A17;">Hi ${vendor.name},</p>
        <p style="margin:0 0 22px;font-size:14px;color:#5C574F;line-height:1.6;">${
          isBooking ? `${customerName} has booked and paid. Here are the details.` : "You&rsquo;ve got a new order. Here are the details."
        }</p>

        ${
          isBooking
            ? `<table role="presentation" width="100%" style="border:2px solid ${accent};border-radius:10px;margin-bottom:20px;"><tr><td style="padding:14px 18px;">
          <table role="presentation" width="100%">
            <tr><td style="padding:6px 0;font-size:13px;color:#8A857C;width:110px;vertical-align:top;">Client</td><td style="padding:6px 0;font-size:14px;color:#1C1A17;font-weight:600;">${customerName}</td></tr>
            ${bookingRows}
            <tr><td style="padding:6px 0;font-size:13px;color:#8A857C;vertical-align:top;">Booked on</td><td style="padding:6px 0;font-size:14px;color:#1C1A17;">${formatOrderDate(createdAt)}</td></tr>
          </table>
        </td></tr></table>`
            : ""
        }

        <table role="presentation" width="100%" style="background:#FAF9F6;border-radius:10px;margin-bottom:20px;"><tr><td style="padding:16px 18px;font-size:13px;color:#5C574F;">
          <strong style="color:#1C1A17;">Order</strong> #${ref} &nbsp;&middot;&nbsp; <span style="color:#1E9E5A;font-weight:600;">Paid &#10003;</span><br>
          <strong style="color:#1C1A17;">Placed</strong> ${formatOrderDate(createdAt)}
        </td></tr></table>

        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1C1A17;">Customer</p>
        <table role="presentation" width="100%" style="background:#FAF9F6;border-radius:10px;margin-bottom:20px;"><tr><td style="padding:16px 18px;font-size:13px;color:#5C574F;line-height:1.8;">
          ${customerName}<br>${customerEmail}${customerPhone ? `<br>${customerPhone}` : ""}${deliveryAddress ? `<br>${deliveryAddress}` : ""}
        </td></tr></table>

        ${
          customerNote
            ? `<p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1C1A17;">Note from ${customerName}</p>
        <table role="presentation" width="100%" style="background:#FAF9F6;border-radius:10px;margin-bottom:20px;"><tr><td style="padding:16px 18px;font-size:13px;color:#5C574F;line-height:1.6;">${customerNote}</td></tr></table>`
            : ""
        }

        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1C1A17;">Items</p>
        <table role="presentation" width="100%">
          ${items.map(itemRowHtml).join("")}
        </table>

        <table role="presentation" width="100%" style="margin-top:12px;">
          ${
            deliveryFee > 0
              ? `<tr><td style="padding:4px 0;font-size:13px;color:#8A857C;">Delivery${deliveryAreaName ? ` &middot; ${deliveryAreaName}` : ""}</td><td style="padding:4px 0;font-size:13px;color:#1C1A17;text-align:right;">${formatCurrency(deliveryFee)}</td></tr>`
              : ""
          }
          <tr><td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#1C1A17;border-top:1px solid #EEE9E2;">Order total</td><td style="padding:12px 0 0;font-size:17px;font-weight:700;color:${accent};text-align:right;border-top:1px solid #EEE9E2;">${formatCurrency(totalAmount)}</td></tr>
        </table>

        <table role="presentation" width="100%"><tr><td align="center" style="padding:28px 0 4px;">
          <a href="${APP_URL}/orders/${orderId}" style="display:inline-block;background:#1C1A17;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;">View order in dashboard</a>
        </td></tr></table>
      </td></tr>

      ${brandedFooter("You&rsquo;re receiving this because you sell on Blaqora.")}

    </table></td></tr></table>
  </body></html>`

  return {
    subject: plainText(
      isBooking && firstSlot ? `New booking — ${firstSlot} · ${customerName}` : `New order — ${formatCurrency(totalAmount)}`,
    ),
    html,
  }
}

interface CustomerOrderEmailParams {
  customerName: string
  orderId: string
  createdAt: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  totalAmount: number
  deliveryAreaName?: string | null
  deliveryAddress?: string | null
  paymentReference: string
  vendor: VendorBranding
}

// Email for customers when they place an order — receipt-style, skinned with
// the vendor's own logo/brand color, with a link back to the vendor's store.
export function getOrderConfirmationEmailForCustomer(params: CustomerOrderEmailParams): {
  subject: string
  html: string
} {
  params = escapeDeep(params)
  const { customerName, orderId, createdAt, items, deliveryFee, totalAmount, deliveryAreaName, deliveryAddress, paymentReference, vendor } = params
  const accent = resolveBrandColor(vendor.brandColor)
  const logo = vendor.logoUrl || `${APP_URL}/blaqora-icon.png`
  const ref = orderRef(orderId)
  const contactLines = [
    vendor.email ? `Email &nbsp;<a href="mailto:${vendor.email}" style="color:${accent};">${vendor.email}</a>` : null,
    vendor.phone ? `Call &nbsp;${vendor.phone}` : null,
    vendor.address ? vendor.address : null,
  ].filter(Boolean)

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
    body{margin:0;padding:0;background:#F1EEE9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
    table{border-collapse:collapse;} img{border:0;display:block;} a{text-decoration:none;}
  </style></head><body>
    <table role="presentation" width="100%" style="background:#F1EEE9;padding:32px 0;"><tr><td align="center">
    <table role="presentation" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <tr><td style="background:${accent};padding:36px 32px 28px;" align="center">
        <img src="${logo}" width="56" height="56" style="width:56px;height:56px;border-radius:50%;border:3px solid rgba(255,255,255,0.6);object-fit:cover;" alt="">
        <p style="margin:14px 0 4px;font-size:20px;color:#ffffff;font-weight:700;">${vendor.name}</p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.85);letter-spacing:0.04em;text-transform:uppercase;">Order Confirmed</p>
      </td></tr>

      <tr><td style="padding:32px;">
        <p style="margin:0 0 4px;font-size:15px;color:#1C1A17;">Hi ${customerName},</p>
        <p style="margin:0 0 24px;font-size:14px;color:#5C574F;line-height:1.6;">Thanks for shopping with ${vendor.name}. Your payment went through and here&rsquo;s your receipt.</p>

        <table role="presentation" width="100%" style="background:#FAF9F6;border-radius:10px;margin-bottom:24px;"><tr><td style="padding:16px 18px;font-size:13px;color:#5C574F;">
          <strong style="color:#1C1A17;">Order</strong> &nbsp;#${ref}<br>
          <strong style="color:#1C1A17;">Placed</strong> &nbsp;${formatOrderDate(createdAt)}<br>
          <strong style="color:#1C1A17;">Payment ref</strong> &nbsp;${paymentReference}
        </td></tr></table>

        <table role="presentation" width="100%">
          ${items.map(itemRowHtml).join("")}
        </table>

        <table role="presentation" width="100%" style="margin-top:12px;">
          ${
            deliveryFee > 0
              ? `<tr><td style="padding:4px 0;font-size:13px;color:#8A857C;">Delivery${deliveryAreaName ? ` &middot; ${deliveryAreaName}` : ""}</td><td style="padding:4px 0;font-size:13px;color:#1C1A17;text-align:right;">${formatCurrency(deliveryFee)}</td></tr>`
              : ""
          }
          <tr><td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#1C1A17;border-top:1px solid #EEE9E2;">Total paid</td><td style="padding:12px 0 0;font-size:17px;font-weight:700;color:${accent};text-align:right;border-top:1px solid #EEE9E2;">${formatCurrency(totalAmount)}</td></tr>
        </table>

        ${
          deliveryAddress
            ? `<table role="presentation" width="100%" style="background:#FAF9F6;border-radius:10px;margin:24px 0;"><tr><td style="padding:14px 18px;font-size:13px;color:#5C574F;"><strong style="color:#1C1A17;">Delivering to</strong><br>${deliveryAddress}</td></tr></table>`
            : `<div style="height:24px;"></div>`
        }

        <table role="presentation" width="100%"><tr><td align="center" style="padding:8px 0 28px;">
          <a href="${storeUrl(vendor)}" style="display:inline-block;background:${accent};color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;">Shop ${vendor.name} again</a>
        </td></tr></table>

        ${
          contactLines.length > 0
            ? `<table role="presentation" width="100%" style="border-top:1px solid #EEE9E2;"><tr><td style="padding-top:20px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1C1A17;">Need help with this order?</p>
                <p style="margin:0;font-size:13px;color:#5C574F;line-height:1.7;">${contactLines.join("<br>")}</p>
              </td></tr></table>`
            : ""
        }
      </td></tr>

      ${brandedFooter(`This receipt was sent by ${vendor.name} via Blaqora.`)}

    </table></td></tr></table>
  </body></html>`

  return {
    subject: plainText(`Order confirmed — ${formatCurrency(totalAmount)}`),
    html,
  }
}

const ORDER_STATUS_COPY: Record<string, { label: string; headline: string; message: string }> = {
  pending: {
    label: "Pending",
    headline: "Order pending",
    message: "Your order is on hold and will be processed shortly.",
  },
  confirmed: {
    label: "Confirmed",
    headline: "Order confirmed",
    message: "Your order is confirmed and being prepared.",
  },
  processing: {
    label: "Processing",
    headline: "Order processing",
    message: "Your order is being prepared for delivery.",
  },
  shipped: {
    label: "Shipped",
    headline: "Your order has shipped",
    message: "Your order is on its way to you.",
  },
  delivered: {
    label: "Delivered",
    headline: "Order delivered",
    message: "Your order has been delivered. We hope you love it!",
  },
  cancelled: {
    label: "Cancelled",
    headline: "Order cancelled",
    message: "Your order has been cancelled. If this wasn't expected, contact the seller below.",
  },
}

interface OrderStatusUpdateEmailParams {
  customerName: string
  orderId: string
  status: string
  trackingNumber?: string | null
  trackingUrl?: string | null
  vendor: VendorBranding
}

// Email for customers when a vendor manually changes an order's status from
// the order detail page — vendor opts in per change, not sent automatically
// for every status (that would be spammy for internal-only transitions).
export function getOrderStatusUpdateEmailForCustomer(params: OrderStatusUpdateEmailParams): {
  subject: string
  html: string
} {
  params = escapeDeep(params)
  const { customerName, orderId, status, trackingNumber, trackingUrl, vendor } = params
  const accent = resolveBrandColor(vendor.brandColor)
  const logo = vendor.logoUrl || `${APP_URL}/blaqora-icon.png`
  const ref = orderRef(orderId)
  const copy = ORDER_STATUS_COPY[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    headline: "Order update",
    message: `Your order status changed to "${status}".`,
  }
  const contactLines = [
    vendor.email ? `Email &nbsp;<a href="mailto:${vendor.email}" style="color:${accent};">${vendor.email}</a>` : null,
    vendor.phone ? `Call &nbsp;${vendor.phone}` : null,
  ].filter(Boolean)

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
    body{margin:0;padding:0;background:#F1EEE9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
    table{border-collapse:collapse;} img{border:0;display:block;} a{text-decoration:none;}
  </style></head><body>
    <table role="presentation" width="100%" style="background:#F1EEE9;padding:32px 0;"><tr><td align="center">
    <table role="presentation" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <tr><td style="background:${accent};padding:36px 32px 28px;" align="center">
        <img src="${logo}" width="56" height="56" style="width:56px;height:56px;border-radius:50%;border:3px solid rgba(255,255,255,0.6);object-fit:cover;" alt="">
        <p style="margin:14px 0 4px;font-size:20px;color:#ffffff;font-weight:700;">${vendor.name}</p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.85);letter-spacing:0.04em;text-transform:uppercase;">${copy.label}</p>
      </td></tr>

      <tr><td style="padding:32px;">
        <p style="margin:0 0 4px;font-size:15px;color:#1C1A17;">Hi ${customerName},</p>
        <p style="margin:0 0 24px;font-size:15px;color:#1C1A17;font-weight:600;">${copy.headline}</p>
        <p style="margin:-16px 0 24px;font-size:14px;color:#5C574F;line-height:1.6;">${copy.message}</p>

        <table role="presentation" width="100%" style="background:#FAF9F6;border-radius:10px;margin-bottom:24px;"><tr><td style="padding:16px 18px;font-size:13px;color:#5C574F;">
          <strong style="color:#1C1A17;">Order</strong> &nbsp;#${ref}<br>
          <strong style="color:#1C1A17;">Status</strong> &nbsp;${copy.label}
          ${trackingNumber ? `<br><strong style="color:#1C1A17;">Tracking number</strong> &nbsp;${trackingNumber}` : ""}
        </td></tr></table>

        <table role="presentation" width="100%"><tr><td align="center" style="padding:8px 0 28px;">
          <a href="${trackingUrl || storeUrl(vendor)}" style="display:inline-block;background:${accent};color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;">${trackingUrl ? "Track your order" : `Visit ${vendor.name}`}</a>
        </td></tr></table>

        ${
          contactLines.length > 0
            ? `<table role="presentation" width="100%" style="border-top:1px solid #EEE9E2;"><tr><td style="padding-top:20px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1C1A17;">Questions about this order?</p>
                <p style="margin:0;font-size:13px;color:#5C574F;line-height:1.7;">${contactLines.join("<br>")}</p>
              </td></tr></table>`
            : ""
        }
      </td></tr>

      ${brandedFooter(`This update was sent by ${vendor.name} via Blaqora.`)}

    </table></td></tr></table>
  </body></html>`

  return {
    subject: plainText(`${copy.headline} — #${ref}`),
    html,
  }
}

interface WithdrawalEmailParams {
  vendorName: string
  amount: number
  status: "approved" | "rejected"
  withdrawalId: string
  bankName?: string
  accountNumber?: string
  adminNote?: string
}

// Email for vendors when withdrawal is updated
export function getWithdrawalUpdateEmailForVendor(params: WithdrawalEmailParams): { subject: string; html: string } {
  params = escapeDeep(params)
  const { vendorName, amount, status, withdrawalId, bankName, accountNumber, adminNote } = params

  const isApproved = status === "approved"
  const statusText = isApproved ? "Approved" : "Rejected"
  const statusColor = isApproved ? "#16a34a" : "#dc2626"

  const content = `
    <div class="header">
      <h1>Withdrawal ${statusText}</h1>
    </div>
    <div class="content">
      <p>Hi ${vendorName},</p>
      <p>Your withdrawal request has been <strong style="color: ${statusColor};">${statusText.toLowerCase()}</strong>.</p>
      
      <div class="${isApproved ? "highlight" : "warning"}">
        <strong>Withdrawal ID:</strong> ${withdrawalId.substring(0, 8)}...<br>
        <strong>Amount:</strong> ${formatCurrency(amount)}<br>
        <strong>Status:</strong> <span style="color: ${statusColor};">${statusText}</span>
        ${bankName ? `<br><strong>Bank:</strong> ${bankName}` : ""}
        ${accountNumber ? `<br><strong>Account:</strong> ****${accountNumber.slice(-4)}` : ""}
      </div>
      
      ${isApproved ? `<p>The funds will be transferred to your bank account within 1-3 business days.</p>` : ""}
      
      ${adminNote ? `<p><strong>Note from Admin:</strong> ${adminNote}</p>` : ""}
      
      <a href="${APP_URL}/payouts" class="btn">View Payouts</a>
    </div>
  `

  return {
    subject: plainText(`Withdrawal ${statusText} - ${formatCurrency(amount)}`),
    html: emailTemplate(content),
  }
}

interface DigitalDownloadEmailParams {
  customerName: string
  vendorName: string
  files: { title: string; url: string }[]
}

// Email for customers to download their digital product(s) after payment
export function getDigitalDownloadEmailForCustomer(params: DigitalDownloadEmailParams): {
  subject: string
  html: string
} {
  params = escapeDeep(params)
  const { customerName, vendorName, files } = params

  const linksHtml = files
    .map((f) => `<p><a href="${f.url}" class="btn">Download ${f.title}</a></p>`)
    .join("")

  const content = `
    <div class="header">
      <h1>Your download is ready</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Thanks for your purchase from ${vendorName}. Your file${files.length > 1 ? "s are" : " is"} ready below.</p>
      ${linksHtml}
      <p>If a link doesn't work, contact the seller directly and they can resend it.</p>
    </div>
  `

  return {
    subject: plainText(`Your download from ${vendorName}`),
    html: emailTemplate(content),
  }
}

interface TicketEmailParams {
  customerName: string
  vendorName: string
  eventName: string
  eventDate?: string | null
  eventLocation?: string | null
  tierName?: string | null
  // One per admission. qrImageUrl is a hosted PNG (data: images are blocked by Gmail).
  tickets: { code: string; url: string; qrImageUrl: string }[]
}

// Email for customers with their QR tickets after payment
export function getTicketEmailForCustomer(params: TicketEmailParams): { subject: string; html: string } {
  params = escapeDeep(params)
  const { customerName, vendorName, eventName, eventDate, eventLocation, tierName, tickets } = params
  const many = tickets.length > 1

  const ticketsHtml = tickets
    .map(
      (t, i) => `
      <div style="text-align:center;margin:24px 0;padding:16px;border:1px solid #eee;border-radius:12px;">
        ${many ? `<p style="margin:0 0 8px;font-weight:600;">Ticket ${i + 1} of ${tickets.length}</p>` : ""}
        <img src="${t.qrImageUrl}" alt="QR code for ticket ${i + 1}" width="220" height="220" style="display:block;margin:0 auto;" />
        <p style="margin:8px 0 0;font-family:monospace;font-size:12px;color:#666;">${t.code.slice(0, 8).toUpperCase()}</p>
        <a href="${t.url}" class="btn">View ticket</a>
      </div>`,
    )
    .join("")

  const content = `
    <div class="header">
      <h1>Your ticket${many ? "s are" : " is"} ready</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Here ${many ? "are your tickets" : "is your ticket"} for <strong>${eventName}</strong> from ${vendorName}. Show ${many ? "each QR code" : "the QR code"} at the entrance. Each code works once.</p>
      <div class="highlight">
        ${tierName ? `<strong>Ticket type:</strong> ${tierName}<br>` : ""}
        ${eventDate ? `<strong>Date:</strong> ${eventDate}<br>` : ""}
        ${eventLocation ? `<strong>Venue:</strong> ${eventLocation}<br>` : ""}
        <strong>Admits:</strong> ${tickets.length}
      </div>
      ${ticketsHtml}
      <p>Keep this email. If the images don't load, tap "View ticket" to show the code on your phone.</p>
    </div>
  `

  return {
    subject: plainText(`Your ticket${many ? "s" : ""} for ${eventName}`),
    html: emailTemplate(content),
  }
}

interface SystemUpdateEmailParams {
  recipientName?: string
  title: string
  message: string
  ctaText?: string
  ctaUrl?: string
}

// Email for system announcements
export function getSystemUpdateEmail(params: SystemUpdateEmailParams): { subject: string; html: string } {
  params = escapeDeep(params)
  const { recipientName, title, message, ctaText, ctaUrl } = params

  const content = `
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${recipientName ? `<p>Hi ${recipientName},</p>` : ""}
      <p>${message.replace(/\n/g, "<br>")}</p>
      
      ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="btn">${ctaText}</a>` : ""}
    </div>
  `

  return {
    subject: plainText(title),
    html: emailTemplate(content),
  }
}
