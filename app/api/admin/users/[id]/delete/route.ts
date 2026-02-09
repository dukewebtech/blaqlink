import { createServerClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Check if user is admin
    const { data: adminData } = await adminClient.from("users").select("is_admin, role").eq("id", user.id).single()

    if (!adminData?.is_admin && adminData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = (await params).id

    // Verify user exists
    const { data: userData, error: userError } = await adminClient.from("users").select("id").eq("id", userId).single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user from Supabase auth
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error("[v0] Error deleting user auth:", deleteAuthError)
      return NextResponse.json({ error: "Failed to delete user: " + deleteAuthError.message }, { status: 500 })
    }

    console.log("[v0] User deleted:", userId)

    return NextResponse.json({ success: true, message: "User permanently deleted" })
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
