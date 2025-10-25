import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: orders, error } = await supabase
      .from("orders")
      .select("customer_email, customer_name, customer_phone, total_amount, shipping_address, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Group orders by customer email and aggregate data
    const customerMap = new Map()

    orders?.forEach((order) => {
      const email = order.customer_email
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          email,
          name: order.customer_name,
          phone: order.customer_phone,
          address: order.shipping_address,
          totalPurchases: 0,
          orderCount: 0,
          firstOrderDate: order.created_at,
        })
      }

      const customer = customerMap.get(email)
      customer.totalPurchases += Number(order.total_amount) || 0
      customer.orderCount += 1
    })

    const customers = Array.from(customerMap.values())

    return NextResponse.json({ customers })
  } catch (error) {
    console.error("[v0] Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}
