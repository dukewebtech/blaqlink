import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Fetching platform settings...")
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase.from("users").select("is_admin").eq("auth_id", user.id).maybeSingle()

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { data: settings, error } = await supabase.from("platform_settings").select("*").maybeSingle()

    if (error) {
      console.error("[v0] Error fetching platform settings:", error.message)
      if (error.code === "PGRST116" || error.message.includes("schema cache")) {
        console.log("[v0] Platform settings table not found, returning defaults")
        return NextResponse.json({
          ok: true,
          settings: {
            commission_percentage: 10,
            minimum_withdrawal_amount: 5000,
          },
          needsSetup: true,
          message: "Please run the SQL script in scripts/001-create-platform-settings.sql",
        })
      }
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    if (!settings) {
      console.log("[v0] No platform settings found, returning defaults")
      return NextResponse.json({
        ok: true,
        settings: {
          commission_percentage: 10,
          minimum_withdrawal_amount: 5000,
        },
        needsSetup: true,
        message: "Please run the SQL script in scripts/001-create-platform-settings.sql",
      })
    }

    console.log("[v0] Platform settings fetched:", settings)
    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    console.error("[v0] Platform settings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    console.log("[v0] Updating platform settings...")
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase.from("users").select("is_admin").eq("auth_id", user.id).maybeSingle()

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { commission_percentage, minimum_withdrawal_amount } = body

    console.log("[v0] Update request:", { commission_percentage, minimum_withdrawal_amount })

    // Validate inputs
    if (commission_percentage !== undefined && (commission_percentage < 0 || commission_percentage > 100)) {
      return NextResponse.json({ error: "Commission must be between 0 and 100" }, { status: 400 })
    }

    if (minimum_withdrawal_amount !== undefined && minimum_withdrawal_amount < 0) {
      return NextResponse.json({ error: "Minimum withdrawal amount must be positive" }, { status: 400 })
    }

    // Use admin client to update settings
    const adminClient = await createAdminClient()

    const { data: existingSettings, error: fetchError } = await adminClient
      .from("platform_settings")
      .select("id")
      .maybeSingle()

    if (fetchError && (fetchError.code === "PGRST116" || fetchError.message.includes("schema cache"))) {
      console.error("[v0] Platform settings table doesn't exist")
      return NextResponse.json(
        {
          error:
            "Platform settings table not found. Please run the SQL script in scripts/001-create-platform-settings.sql",
          needsSetup: true,
        },
        { status: 404 },
      )
    }

    if (!existingSettings) {
      console.log("[v0] Creating new platform settings record...")
      const { data: newSettings, error: insertError } = await adminClient
        .from("platform_settings")
        .insert({
          commission_percentage: commission_percentage ?? 10,
          minimum_withdrawal_amount: minimum_withdrawal_amount ?? 5000,
        })
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Error creating platform settings:", insertError)
        return NextResponse.json({ error: "Failed to create settings: " + insertError.message }, { status: 500 })
      }

      console.log("[v0] Platform settings created successfully:", newSettings)
      return NextResponse.json({ ok: true, settings: newSettings, message: "Settings created successfully" })
    }

    // Update existing settings
    const updateData: any = {}
    if (commission_percentage !== undefined) updateData.commission_percentage = commission_percentage
    if (minimum_withdrawal_amount !== undefined) updateData.minimum_withdrawal_amount = minimum_withdrawal_amount

    console.log("[v0] Updating settings with:", updateData)

    const { data: updatedSettings, error: updateError } = await adminClient
      .from("platform_settings")
      .update(updateData)
      .eq("id", existingSettings.id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating platform settings:", updateError)
      return NextResponse.json({ error: "Failed to update settings: " + updateError.message }, { status: 500 })
    }

    console.log("[v0] Platform settings updated successfully:", updatedSettings)
    return NextResponse.json({ ok: true, settings: updatedSettings, message: "Settings updated successfully" })
  } catch (error: any) {
    console.error("[v0] Platform settings update API error:", error)
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}
