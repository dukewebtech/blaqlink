import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Fetching withdrawal requests...")
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Auth user ID:", user.id)

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userRecord) {
      console.error("[v0] Error fetching user record:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[v0] User record ID:", userRecord.id)

    // Fetch withdrawal requests for this user using the correct user.id
    const { data: requests, error: fetchError } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("user_id", userRecord.id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("[v0] Error fetching withdrawal requests:", fetchError)
      return NextResponse.json({ error: "Failed to fetch withdrawal requests" }, { status: 500 })
    }

    console.log("[v0] Withdrawal requests fetched:", requests?.length || 0)

    return NextResponse.json({
      ok: true,
      data: requests || [],
    })
  } catch (error) {
    console.error("[v0] Error in withdrawal requests API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[v0] Creating withdrawal request:", body)

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth check - User:", user ? "Found" : "Not found")
    console.log("[v0] Auth check - Error:", authError ? authError.message : "None")

    if (authError || !user) {
      console.log("[v0] User not authenticated for withdrawal request")
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Please log in to submit withdrawal requests",
        },
        { status: 401 },
      )
    }

    console.log("[v0] Auth user ID:", user.id)

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userRecord) {
      console.error("[v0] Error fetching user record:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[v0] User record ID:", userRecord.id)

    const { amount, bankName, accountNumber, accountName } = body

    // Validate input
    if (!amount || !bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Create withdrawal request using the correct user.id
    const { data: withdrawalRequest, error: createError } = await supabase
      .from("withdrawal_requests")
      .insert({
        user_id: userRecord.id,
        amount: Number.parseFloat(amount),
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        status: "pending",
      })
      .select()
      .single()

    if (createError) {
      console.error("[v0] Error creating withdrawal request:", createError)
      return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 })
    }

    console.log("[v0] Withdrawal request created successfully:", withdrawalRequest.id)

    return NextResponse.json({
      ok: true,
      data: withdrawalRequest,
    })
  } catch (error) {
    console.error("[v0] Error in withdrawal request creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
