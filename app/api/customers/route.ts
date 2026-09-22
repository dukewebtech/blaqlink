import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

interface CustomerSummary {
  email: string
  name: string
  phone: string
  totalPurchases: number
  orderCount: number
  lastOrderDate: string
}

// Was previously computed client-side by the Customers page from the full
// output of GET /api/orders (every order, with nested order_items, for the
// vendor's entire history). Fetches only the four columns this aggregation
// actually needs and does the aggregation here instead of in the browser.
export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("customer_email, customer_name, customer_phone, total_amount, created_at")
      .eq("user_id", userProfile.id)

    if (error) {
      console.error("[v0] Customers fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const customerMap = new Map<string, CustomerSummary>()

    for (const order of orders ?? []) {
      const email = order.customer_email
      if (!email) continue

      const existing = customerMap.get(email)
      if (existing) {
        existing.totalPurchases += Number(order.total_amount || 0)
        existing.orderCount += 1
        if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at
        }
      } else {
        customerMap.set(email, {
          email,
          name: order.customer_name || "Unknown",
          phone: order.customer_phone || "N/A",
          totalPurchases: Number(order.total_amount || 0),
          orderCount: 1,
          lastOrderDate: order.created_at,
        })
      }
    }

    return NextResponse.json({ customers: Array.from(customerMap.values()) })
  } catch (error) {
    console.error("[v0] Customers API error:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}
