import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
    "/admin/login",
    "/admin/setup",
  ]

  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isPublicPath) {
    return supabaseResponse
  }

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

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Auth timeout")), 1000)
    })

    const authPromise = supabase.auth.getUser()

    const {
      data: { user },
    } = await Promise.race([authPromise, timeoutPromise]).catch(() => ({ data: { user: null } }))

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")

    if (isAdminRoute) {
      // Allow admin users to access admin routes without onboarding check
      try {
        const { data: userData } = await supabase.from("users").select("is_admin, role").eq("id", user.id).single()

        if (userData?.is_admin || userData?.role === "admin") {
          return supabaseResponse
        } else {
          // Non-admin trying to access admin routes
          const url = request.nextUrl.clone()
          url.pathname = "/dashboard"
          return NextResponse.redirect(url)
        }
      } catch (error) {
        console.log("[v0] Error checking admin status:", error)
      }
    }

    if (!request.nextUrl.pathname.startsWith("/onboarding")) {
      try {
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
        console.log("[v0] Onboarding check error, redirecting to onboarding:", error)
        const url = request.nextUrl.clone()
        url.pathname = "/onboarding"
        return NextResponse.redirect(url)
      }
    }

    if (user && (request.nextUrl.pathname === "/signup" || request.nextUrl.pathname === "/login")) {
      const url = request.nextUrl.clone()

      try {
        const { data: userData } = await supabase.from("users").select("is_admin, role").eq("id", user.id).single()

        // Admins go to admin dashboard
        if (userData?.is_admin || userData?.role === "admin") {
          url.pathname = "/admin/dashboard"
          return NextResponse.redirect(url)
        }

        // Regular users: check onboarding
        const { data: progress } = await supabase
          .from("onboarding_progress")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single()

        const { data: kycData } = await supabase.from("users").select("admin_kyc_approved").eq("id", user.id).single()

        if (!progress?.onboarding_completed || !kycData?.admin_kyc_approved) {
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
    console.log("[v0] Middleware error (continuing):", error instanceof Error ? error.message : "Unknown error")
    return supabaseResponse
  }
}
