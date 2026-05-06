/**
 * API helper utilities
 * Common patterns for API route handlers
 */

import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export interface AuthenticatedUser {
  authId: string
  userId: string
  email: string
  isAdmin: boolean
}

/**
 * Get authenticated user from request
 * Handles auth errors gracefully
 */
export async function getAuthenticatedUser(): Promise<
  { success: true; user: AuthenticatedUser } | { success: false; error: NextResponse }
> {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[v0] Auth service error:", authError.message)
      return {
        success: false,
        error: NextResponse.json({ error: "Authentication service temporarily unavailable" }, { status: 503 }),
      }
    }

    if (!user) {
      return {
        success: false,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      }
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id, email, is_admin, role")
      .eq("auth_id", user.id)
      .single()

    if (profileError || !userProfile) {
      console.error("[v0] User profile not found:", profileError)
      return {
        success: false,
        error: NextResponse.json({ error: "User profile not found" }, { status: 404 }),
      }
    }

    return {
      success: true,
      user: {
        authId: user.id,
        userId: userProfile.id,
        email: userProfile.email,
        isAdmin: userProfile.is_admin || userProfile.role === "admin",
      },
    }
  } catch (error) {
    console.error("[v0] Unexpected error in getAuthenticatedUser:", error)
    return {
      success: false,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    }
  }
}

/**
 * Require admin privileges
 */
export async function requireAdmin(): Promise<
  { success: true; user: AuthenticatedUser } | { success: false; error: NextResponse }
> {
  const result = await getAuthenticatedUser()

  if (!result.success) {
    return result
  }

  if (!result.user.isAdmin) {
    return {
      success: false,
      error: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    }
  }

  return result
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`[v0] Error in ${context}:`, error)

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message, context }, { status: 500 })
  }

  return NextResponse.json({ error: "An unexpected error occurred", context }, { status: 500 })
}
