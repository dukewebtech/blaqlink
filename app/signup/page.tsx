"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setIsValidEmail(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!fullName.trim()) {
      setError("Please enter your full name")
      setIsLoading(false)
      return
    }

    if (!isValidEmail) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      console.log("[v0] Starting signup process with supabase.auth.signUp()...")

      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "vendor",
          },
        },
      })

      if (signUpError) {
        console.error("[v0] Signup error:", signUpError)
        throw new Error(signUpError.message)
      }

      console.log("[v0] Signup response:", data)

      // Check if email confirmation is required
      if (data.user && !data.user.confirmed_at && data.user.confirmation_sent_at) {
        setError(
          "Email confirmation is enabled. Please disable 'Email Confirmations' in your Supabase Dashboard (Authentication → Providers → Email) to allow automatic verification.",
        )
        setIsLoading(false)
        return
      }

      console.log("[v0] User created successfully, redirecting to login...")
      setSuccess(true)

      setTimeout(() => {
        router.push("/login?signup=success")
      }, 1500)
    } catch (error: unknown) {
      console.error("[v0] Signup error:", error)
      if (error instanceof Error) {
        if (error.message.includes("User already registered")) {
          setError("This email is already registered. Please try logging in instead.")
        } else if (error.message.includes("Email confirmations")) {
          setError(error.message)
        } else {
          setError(error.message)
        }
      } else {
        setError("An unexpected error occurred during signup. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Account Created!</h2>
            <p className="text-muted-foreground">Redirecting you to login page...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-2">
            <Logo />
            <h1 className="text-4xl font-bold tracking-tight mt-8">Sign Up</h1>
            <p className="text-muted-foreground text-base">Create your account to start selling online</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium hover:bg-accent transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-transparent"
              type="button"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 transition-all duration-300 focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  className="h-12 pr-10 transition-all duration-300 focus:ring-2 focus:ring-primary"
                  required
                />
                {isValidEmail && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success animate-in zoom-in-95 duration-300" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10 transition-all duration-300 focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remember me ?
                </label>
              </div>
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forget Password
              </Link>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <Button
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-white leading-tight text-balance">
              Easy-to-Use Dashboard for Managing Your Business.
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              Streamline Your Business Management with Our User-Friendly Dashboard. Simplify complex tasks, track key
              metrics, and make informed decisions effortlessly
            </p>
          </div>

          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                <div className="text-white/60 text-sm">Dashboard Preview</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <div className="w-8 h-1 bg-white rounded-full" />
            <div className="w-8 h-1 bg-white/30 rounded-full" />
            <div className="w-8 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
