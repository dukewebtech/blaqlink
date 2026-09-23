import { type NextRequest, NextResponse } from "next/server"
import { initializeTransaction } from "@/lib/paystack"
import { getAppUrl } from "@/lib/utils/app-url"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, amount, metadata, callbackUrl: clientCallbackUrl } = body

    console.log("[v0] Initializing Paystack payment:", { email, amount })

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("[v0] PAYSTACK_SECRET_KEY is not set")
      return NextResponse.json({ error: "Payment gateway not configured. Please contact support." }, { status: 500 })
    }

    const callbackUrl = clientCallbackUrl || `${getAppUrl()}/store/payment/verify`
    console.log("[v0] Callback URL:", callbackUrl)

    const data = await initializeTransaction({ email, amount, metadata, callbackUrl })
    console.log("[v0] Paystack response:", data)

    if (!data.status) {
      console.error("[v0] Paystack error:", data.message)
      return NextResponse.json({ error: data.message || "Payment initialization failed" }, { status: 400 })
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    })
  } catch (error) {
    console.error("[v0] Payment initialization error:", error)
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
  }
}
