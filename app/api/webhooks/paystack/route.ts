import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { confirmPaystackPayment } from "@/lib/storefront/confirm-paystack-payment"

// Paystack → Settings → API Keys & Webhooks → Webhook URL:
//   https://blaqora.store/api/webhooks/paystack
// Creates the order even when the buyer never returns to the confirmation page
// (closed tab, lost signal, bank app). Same code path as /api/payment/verify,
// so whichever arrives first creates the order and the other is a no-op.

const TOLERANCE_SECONDS = 300

function safeEqualHex(a: string, b: string) {
  return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

// `Paystack-Signature: t=<unix>,v1=<key id>:<hex>[,v1=...]` — each hex is
// HMAC-SHA512 over "<t>.<raw body>" keyed with the whole whsec_ string. One v1
// entry per live secret during a rotation, so any match passes.
function verifySigningSecret(rawBody: string, header: string, secret: string): string | null {
  let timestamp: string | null = null
  const signatures: string[] = []
  for (const part of header.split(",")) {
    const [key, ...rest] = part.trim().split("=")
    const value = rest.join("=")
    if (key === "t") timestamp = value
    else if (key === "v1") signatures.push((value.includes(":") ? value.slice(value.indexOf(":") + 1) : value).toLowerCase())
  }
  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return "malformed Paystack-Signature header"
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return "Paystack-Signature timestamp out of tolerance"

  const expected = crypto.createHmac("sha512", secret).update(`${timestamp}.${rawBody}`).digest("hex")
  return signatures.some((sig) => safeEqualHex(expected, sig)) ? null : "Paystack-Signature does not match"
}

function verify(request: NextRequest, rawBody: string): string | null {
  const signingSecret = process.env.PAYSTACK_WEBHOOK_SECRET
  if (signingSecret) {
    const header = request.headers.get("paystack-signature")
    return header ? verifySigningSecret(rawBody, header, signingSecret) : "missing Paystack-Signature header"
  }

  // Legacy scheme, only possible with a full sk_ key — Paystack never signs with an rk_.
  const key = process.env.PAYSTACK_SECRET_KEY ?? ""
  if (!key.startsWith("sk_")) return "PAYSTACK_WEBHOOK_SECRET is not set"
  const header = (request.headers.get("x-paystack-signature") ?? "").toLowerCase()
  const expected = crypto.createHmac("sha512", key).update(rawBody).digest("hex")
  return header && safeEqualHex(expected, header) ? null : "X-Paystack-Signature does not match"
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const failure = verify(request, rawBody)
  if (failure) {
    console.error("[paystack/webhook] Rejected:", failure)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { event?: string; data?: { reference?: string; domain?: string } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // One URL can be set in both the test and live dashboards — ignore the other mode's events
  const liveKey = (process.env.PAYSTACK_SECRET_KEY ?? "").includes("_live_")
  if (event.data?.domain && event.data.domain !== (liveKey ? "live" : "test")) {
    return NextResponse.json({ received: true })
  }

  if (event.event !== "charge.success" || !event.data?.reference) {
    return NextResponse.json({ received: true })
  }

  const reference = event.data.reference
  try {
    const result = await confirmPaystackPayment(reference)
    if (!result.ok) {
      // 4xx outcomes (no checkout session, amount mismatch) won't change on retry
      console.error("[paystack/webhook] Not confirmed:", reference, result.error)
      if (result.status >= 500) return NextResponse.json({ error: result.error }, { status: 500 })
    } else {
      console.log("[paystack/webhook]", result.created ? "Order created:" : "Order already existed:", reference)
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    // 500 so Paystack retries
    console.error("[paystack/webhook] Error confirming", reference, error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
