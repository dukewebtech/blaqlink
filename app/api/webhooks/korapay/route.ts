import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/server"

// Korapay is used only for vendor payouts (customer payments go through
// Paystack), so this handles transfer events only.

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.KORA_SECRET_KEY
  if (!secret) return false
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  // timingSafeEqual throws on length mismatch — treat that as a bad signature
  if (signature.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-korapay-signature") ?? ""

    if (!verifySignature(rawBody, signature)) {
      console.error("[korapay/webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const { event, data } = JSON.parse(rawBody)
    if (!data?.reference) return NextResponse.json({ received: true })

    const supabase = createAdminClient()

    if (event === "transfer.success") {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({ status: "completed", kora_payout_status: "success" })
        .eq("kora_payout_reference", data.reference)
      if (error) {
        console.error("[korapay/webhook] payout success update failed:", error.message)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
      }
    }

    if (event === "transfer.failed") {
      // "failed" withdrawals don't count against the balance, so the money
      // becomes available to withdraw again.
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "failed",
          kora_payout_status: "failed",
          admin_notes: `Korapay payout failed: ${String(data.narration ?? data.message ?? "no details").slice(0, 300)}`,
        })
        .eq("kora_payout_reference", data.reference)
      if (error) {
        console.error("[korapay/webhook] payout failure update failed:", error.message)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[korapay/webhook] Handler error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
