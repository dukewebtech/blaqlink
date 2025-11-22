"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSignupSuccess, setShowSignupSuccess] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("signup") === "success") {
      setShowSignupSuccess(true)
      // Auto-hide the message after 5 seconds
      const timer = setTimeout(() => {
        setShowSignupSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

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

      const onboardingResponse = await fetch("/api/onboarding")
      if (onboardingResponse.ok) {
        const onboardingData = await onboardingResponse.json()

        if (!onboardingData.progress?.onboarding_completed || !onboardingData.adminKycApproved) {
          // Redirect to onboarding if not complete
          window.location.href = "/onboarding"
          return
        }
      }

      // Onboarding complete, check profile
      const profileResponse = await fetch("/api/users/me")
      const profileData = await profileResponse.json()

      if (!profileResponse.ok || !profileData.data?.user) {
        // No profile exists, redirect to complete profile
        window.location.href = "/settings/account?complete=true"
      } else {
        // Profile exists and onboarding complete, go to dashboard
        window.location.href = "/dashboard"
      }
    } catch (error: unknown) {
      console.error("[v0] Login failed:", error)
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
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {showSignupSuccess && (
            <div className="rounded-lg bg-success/10 border border-success/20 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-success">Account created successfully!</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is ready to use. Please sign in with your credentials.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <Button type="submit" className="h-12 w-full text-base" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Marketing Content */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-gradient-to-br lg:from-blue-600 lg:to-blue-800 lg:p-16 lg:text-white">
        <div className="space-y-6">
          <h2 className="text-4xl font-bold">Easy-to-Use Dashboard for Managing Your Business.</h2>
          <p className="text-lg text-blue-100">
            Streamline Your Business Management with Our User-Friendly Dashboard. Simplify complex tasks, track key
            metrics, and make informed decisions effortlessly
          </p>
          <div className="flex gap-2">
            <div className="h-2 w-12 rounded-full bg-white"></div>
            <div className="h-2 w-12 rounded-full bg-white/30"></div>
            <div className="h-2 w-12 rounded-full bg-white/30"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
