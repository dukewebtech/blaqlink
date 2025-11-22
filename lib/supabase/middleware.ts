import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Create response that will be returned
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth check for public routes
  const publicPaths = [
    "/signup",
    "/login",
    "/auth",
    "/templates",
    "/store",
    "/_next",
    "/api",
    "/api-test",
    "/",
    "/admin",
  ]

  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isPublicPath) {
    return supabaseResponse
  }

  // Try to check auth, but don't block if it fails
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Auth timeout")), 1000)
    })

    const authPromise = supabase.auth.getUser()

    const {
      data: { user },
    } = await Promise.race([authPromise, timeoutPromise]).catch(() => ({ data: { user: null } }))

    // If no user, redirect to login (but don't block if auth check failed)
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // Check if user needs to complete onboarding
    if (user && !request.nextUrl.pathname.startsWith("/onboarding")) {
      try {
        // Check onboarding status
        const { data: progress } = await supabase
          .from("onboarding_progress")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single()

        const { data: userData } = await supabase.from("users").select("admin_kyc_approved").eq("id", user.id).single()

        // Redirect to onboarding if not completed or KYC not approved
        if (!progress?.onboarding_completed || !userData?.admin_kyc_approved) {
          const url = request.nextUrl.clone()
          url.pathname = "/onboarding"
          return NextResponse.redirect(url)
        }
      } catch (error) {
        console.log("[v0] Error checking onboarding status:", error)
        // If error checking onboarding, let them through (fail open)
      }
    }

    // If user is logged in and trying to access login/signup, redirect to dashboard or onboarding
    if (user && (request.nextUrl.pathname.startsWith("/signup") || request.nextUrl.pathname.startsWith("/login"))) {
      const url = request.nextUrl.clone()

      // Check if they need onboarding
      try {
        const { data: progress } = await supabase
          .from("onboarding_progress")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single()

        const { data: userData } = await supabase.from("users").select("admin_kyc_approved").eq("id", user.id).single()

        if (!progress?.onboarding_completed || !userData?.admin_kyc_approved) {
          url.pathname = "/onboarding"
        } else {
          url.pathname = "/dashboard"
        }
      } catch (error) {
        url.pathname = "/onboarding"
      }

      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    // On any error, just continue without auth check
    console.log("[v0] Middleware error (continuing):", error instanceof Error ? error.message : "Unknown error")
    return supabaseResponse
  }
}
