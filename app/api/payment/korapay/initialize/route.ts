import { type NextRequest, NextResponse } from "next/server"
import { initializeCharge } from "@/lib/korapay"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, amount, metadata } = body

    console.log("[korapay] Initializing charge:", { email, amount })

    if (!process.env.KORA_SECRET_KEY) {
      console.error("[korapay] KORA_SECRET_KEY is not set")
      return NextResponse.json({ error: "KoraPay gateway not configured. Please contact support." }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      return NextResponse.json({ error: "Application URL not configured." }, { status: 500 })
    }

    const reference = `KPY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // Persist order data server-side — KoraPay metadata is capped at 50 chars per value
    const supabase = createAdminClient()
    const { error: sessionError } = await supabase
      .from("payment_sessions")
      .insert({ reference, gateway: "korapay", order_data: metadata ?? {} })

    if (sessionError) {
      console.error("[korapay] Failed to save payment session:", sessionError.message)
      return NextResponse.json({ error: "Failed to prepare payment session" }, { status: 500 })
    }

    const data = await initializeCharge({
      reference,
      amount,
      customerEmail: email,
      customerName: metadata?.customer_name ?? email,
      redirectUrl: `${appUrl}/store/payment/korapay/verify`,
      notificationUrl: `${appUrl}/api/webhooks/korapay`,
      metadata: { ref: reference },
    })

    console.log("[korapay] Charge init response status:", data.status)

    if (!data.status) {
      // Clean up the session if KoraPay rejected the charge
      await supabase.from("payment_sessions").delete().eq("reference", reference)
      console.error("[korapay] Charge init failed:", data.message)
      return NextResponse.json({ error: data.message || "KoraPay payment initialization failed" }, { status: 400 })
    }

    return NextResponse.json({
      checkout_url: data.data.checkout_url,
      reference: data.data.reference ?? reference,
    })
  } catch (error) {
    console.error("[korapay] Initialize error:", error)
    return NextResponse.json({ error: "Failed to initialize KoraPay payment" }, { status: 500 })
  }
}
