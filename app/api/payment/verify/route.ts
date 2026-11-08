import { type NextRequest, NextResponse } from "next/server"
import { confirmPaystackPayment } from "@/lib/storefront/confirm-paystack-payment"

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference")
    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    const result = await confirmPaystackPayment(reference)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result.body)
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
