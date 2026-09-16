import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Public endpoint — powers the landing page pricing section and calculator
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: plans, error } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order")

    if (error) {
      console.error("[v0] Error fetching pricing plans:", error)
      return NextResponse.json({ error: "Failed to fetch pricing plans" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, plans })
  } catch (error) {
    console.error("[v0] Pricing plans API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
