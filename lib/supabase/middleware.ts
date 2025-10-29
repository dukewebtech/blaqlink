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

    // If user is logged in and trying to access login/signup, redirect to dashboard
    if (user && (request.nextUrl.pathname.startsWith("/signup") || request.nextUrl.pathname.startsWith("/login"))) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    // On any error, just continue without auth check
    console.log("[v0] Middleware error (continuing):", error instanceof Error ? error.message : "Unknown error")
    return supabaseResponse
  }
}
