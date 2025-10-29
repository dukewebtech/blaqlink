import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { bank_name, account_number, account_name } = body

    // Validate required fields
    if (!bank_name || !account_number || !account_name) {
      return NextResponse.json({ error: "All bank details are required" }, { status: 400 })
    }

    // Update user's bank details
    const { data, error } = await supabase
      .from("users")
      .update({
        bank_name,
        account_number,
        account_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating bank details:", error)
      return NextResponse.json({ error: "Failed to update bank details" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in bank details API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
