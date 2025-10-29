"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Eye, EyeOff, Shield } from "lucide-react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      // Check if user is admin
      const profileResponse = await fetch("/api/users/me")
      const profileData = await profileResponse.json()

      if (!profileResponse.ok || !profileData.data?.user) {
        setError("Unable to fetch user profile")
        setIsLoading(false)
        return
      }

      const user = profileData.data.user

      // Verify admin access
      if (!user.is_admin && user.role !== "admin") {
        setError("Access denied. Admin privileges required.")
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      // Redirect to admin dashboard
      window.location.href = "/admin/dashboard"
    } catch (error: unknown) {
      console.error("[v0] Admin login failed:", error)
      if (error instanceof Error && error.message === "Failed to fetch") {
        setError("Unable to connect to authentication service. Please check your internet connection and try again.")
      } else {
        setError(error instanceof Error ? error.message : "An error occurred during login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Login Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Admin Portal</h1>
            </div>
            <p className="text-muted-foreground">Sign in with your admin credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <Button type="submit" className="h-12 w-full text-base" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In as Admin"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Not an admin?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Vendor Login
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Marketing Content */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-gradient-to-br lg:from-purple-600 lg:to-purple-800 lg:p-16 lg:text-white">
        <div className="space-y-6">
          <h2 className="text-4xl font-bold">Platform Administration</h2>
          <p className="text-lg text-purple-100">
            Manage your entire e-commerce platform from one central location. Monitor vendors, process withdrawals, and
            oversee all transactions with powerful admin tools.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Secure Access</h3>
                <p className="text-sm text-purple-100">Protected admin-only access with role-based permissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
