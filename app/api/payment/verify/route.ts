import { type NextRequest, NextResponse } from "next/server"
import { confirmPaystackPayment } from "@/lib/storefront/confirm-paystack-payment"

const REFERENCE_RE = /^[A-Za-z0-9_.=-]{6,100}$/

// The buyer's return page calls this. Same result on first load, refresh and
// after the webhook has already created the order. Returns only the public
// order summary — no phone, address or full email.
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference")
  if (!reference || !REFERENCE_RE.test(reference)) {
    return NextResponse.json({ error: "Payment reference is missing." }, { status: 400 })
  }

  try {
    const result = await confirmPaystackPayment(reference)
    if (result.state === "pending") return NextResponse.json({ pending: true }, { status: 202 })
    if (result.state === "failed") return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json({ order: result.summary }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[payment/verify] failed:", reference, error)
    return NextResponse.json({ error: "We couldn't confirm your payment yet. Refresh in a moment." }, { status: 500 })
  }
}
