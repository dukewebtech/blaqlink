import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, amount, metadata } = body

    console.log("[v0] Initializing Paystack payment:", { email, amount })

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("[v0] PAYSTACK_SECRET_KEY is not set")
      return NextResponse.json({ error: "Payment gateway not configured. Please contact support." }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("[v0] NEXT_PUBLIC_APP_URL is not set")
      return NextResponse.json({ error: "Application URL not configured. Please contact support." }, { status: 500 })
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/payment/verify`
    console.log("[v0] Callback URL:", callbackUrl)

    // Initialize Paystack payment
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to kobo
        currency: "NGN",
        metadata,
        callback_url: callbackUrl,
      }),
    })

    const data = await response.json()
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
