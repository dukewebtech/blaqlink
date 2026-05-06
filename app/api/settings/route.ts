import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Public endpoint to fetch platform settings (for withdrawal validation)
export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch platform settings (no auth required for reading)
    const { data: settings, error } = await supabase.from("platform_settings").select("*").single()

    if (error) {
      console.error("[v0] Error fetching platform settings:", error)
      // Return default values if settings don't exist
      return NextResponse.json({
        ok: true,
        settings: {
          commission_percentage: 10,
          minimum_withdrawal_amount: 5000,
        },
      })
    }

    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    console.error("[v0] Platform settings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
