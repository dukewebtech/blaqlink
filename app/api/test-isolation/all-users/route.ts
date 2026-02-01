import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Test: Fetching all users for comparison...")
    const supabase = await createServerClient()

    // Verify current user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get all users (for testing purposes only - this shows what data exists)
    const { data: users, error } = await supabase
      .from("users")
      .select("id, auth_id, email, full_name, business_name")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Test: Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Test: Total users in database:", users?.length || 0)

    // Get product counts for each user
    const usersWithCounts = await Promise.all(
      (users || []).map(async (u) => {
        const { count: productCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.id)

        const { count: categoryCount } = await supabase
          .from("categories")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.id)

        const { count: orderCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.id)

        return {
          ...u,
          product_count: productCount || 0,
          category_count: categoryCount || 0,
          order_count: orderCount || 0,
          is_current_user: u.auth_id === user.id,
        }
      }),
    )

    return NextResponse.json({
      users: usersWithCounts,
      current_user_id: user.id,
    })
  } catch (error) {
    console.error("[v0] Test: Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
