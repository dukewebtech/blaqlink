import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          product_title,
          product_type,
          quantity,
          price,
          subtotal
        )
      `)
      .order("created_at", { ascending: false })

    // Filter by status if provided
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: orders, error } = await query

    if (error) throw error

    // Calculate counts for each status
    const { data: allOrders } = await supabase.from("orders").select("status")
    const statusCounts = {
      all: allOrders?.length || 0,
      shipping: allOrders?.filter((o) => o.status === "shipping").length || 0,
      completed: allOrders?.filter((o) => o.status === "completed").length || 0,
      cancelled: allOrders?.filter((o) => o.status === "cancelled").length || 0,
    }

    return NextResponse.json({ orders, statusCounts })
  } catch (error) {
    console.error("[v0] Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
