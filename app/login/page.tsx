"use client"

import type React from "react"
import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"
import { PasswordField } from "@/components/auth/password-field"
import { EmailCodeStep } from "@/components/auth/email-code-step"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

/** Where a signed-in user belongs: admin area, store setup, or dashboard. */
async function destination(): Promise<string> {
  try {
    const me = await fetch("/api/users/me").then((r) => (r.ok ? r.json() : null))
    const user = me?.data?.user
    if (user?.is_admin || user?.role === "admin") return "/admin/dashboard"
    const progress = await fetch("/api/onboarding").then((r) => (r.ok ? r.json() : null))
    return progress?.progress?.onboarding_completed ? "/dashboard" : "/onboarding"
  } catch {
    return "/dashboard" // the middleware still routes unfinished accounts to setup
  }
}

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(() => searchParams.get("email") || "")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const linkExpired = searchParams.get("link") === "expired"

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError("Enter your email and password.")
      return
    }
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (signInError) {
        const m = signInError.message.toLowerCase()
        if (m.includes("not confirmed")) {
          // Never confirmed their email: send a fresh code and confirm right here.
          await supabase.auth.resend({ type: "signup", email: email.trim() })
          setConfirming(true)
        } else if (m.includes("invalid login") || m.includes("invalid credentials")) {
          setError("That email and password don't match. Check them, or reset your password.")
        } else if (m.includes("rate") || m.includes("too many")) {
          setError("Too many attempts. Wait a few minutes and try again.")
        } else {
          setError("We couldn't log you in. Please try again.")
        }
        return
      }
      window.location.href = await destination()
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (confirming) {
    return (
      <AuthShell title="Confirm your email" subtitle="Your account isn't confirmed yet.">
        <EmailCodeStep
          email={email.trim()}
          onVerified={async () => {
            window.location.href = await destination()
          }}
          onChangeEmail={() => setConfirming(false)}
        />
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your store.">
      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        {linkExpired && (
          <p role="status" className="rounded-lg border bg-muted/40 p-3 text-sm">
            That email link has expired or was already used. Log in below. If your email isn&apos;t confirmed yet, we&apos;ll send you a new code.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
          />
        </div>

        <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />

        <div className="flex justify-end">
          <Link href={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`} className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? "Logging in…" : "Log in"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New to Blaqora?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create a store
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
