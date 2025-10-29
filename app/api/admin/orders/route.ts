import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const adminClient = createAdminClient()

    const { data: orders, error } = await adminClient
      .from("orders")
      .select(
        `
        id,
        customer_name,
        customer_email,
        total_amount,
        status,
        payment_status,
        created_at,
        user_id,
        users!inner(full_name, business_name)
      `,
      )
      .order("created_at", { ascending: false })

    if (error) throw error

    const formattedOrders = orders?.map((order: any) => ({
      ...order,
      vendor_name: order.users?.full_name || "Unknown",
      vendor_business: order.users?.business_name || "Unknown",
    }))

    return NextResponse.json({ orders: formattedOrders || [] })
  } catch (error) {
    console.error("[v0] Admin orders API error:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
