"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"
import { PasswordField, MIN_PASSWORD_LENGTH } from "@/components/auth/password-field"
import { CodeInput } from "@/components/auth/email-code-step"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPassword />
    </Suspense>
  )
}

const RESEND_SECONDS = 60

/** Email → 6-digit code + new password, all on one page. */
function ForgotPassword() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState(() => searchParams.get("email") || "")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Enter the email you signed up with.")
      return
    }
    setBusy(true)
    const { error: sendError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setBusy(false)
    if (sendError) {
      setError(sendError.message.toLowerCase().includes("rate") ? "Please wait a minute before asking for another code." : "We couldn't send the code. Please try again.")
      return
    }
    // Same answer whether or not the email has an account, so accounts can't be discovered.
    setStep("code")
    setCooldown(RESEND_SECONDS)
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault()
    setCodeError(null)
    setPasswordError(null)
    if (code.length < 6) return setCodeError("Enter the code from your email.")
    if (password.length < MIN_PASSWORD_LENGTH) return setPasswordError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    setBusy(true)
    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: "recovery" })
    if (verifyError) {
      setBusy(false)
      return setCodeError("That code is wrong or has expired. Check the latest email, or send a new code.")
    }
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) {
      return setPasswordError(
        updateError.message.toLowerCase().includes("different")
          ? "Choose a password you haven't used before."
          : "We couldn't save that password. Try a longer one.",
      )
    }
    window.location.href = "/dashboard"
  }

  if (step === "code") {
    return (
      <AuthShell title="Choose a new password" subtitle="Enter the code we emailed you and your new password.">
        <form onSubmit={reset} className="space-y-5" noValidate>
          <div className="flex gap-3 rounded-lg border bg-muted/30 p-4">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm">
              If <strong className="break-all">{email.trim()}</strong> has a Blaqora account, a 6-digit code is on its way. Check your spam folder too.
            </p>
          </div>
          <CodeInput id="code" value={code} onChange={setCode} error={codeError ?? undefined} />
          <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" error={passwordError ?? undefined} showHint />
          <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? "Saving…" : "Save new password"}
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button type="button" onClick={() => sendCode()} disabled={cooldown > 0 || busy} className="font-medium text-primary disabled:text-muted-foreground">
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
            </button>
            <button type="button" onClick={() => setStep("email")} className="font-medium text-muted-foreground hover:text-foreground">
              Use a different email
            </button>
          </div>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a code to set a new one.">
      <form onSubmit={sendCode} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12"
            aria-invalid={!!error}
            aria-describedby={error ? "email-error" : undefined}
          />
          {error && (
            <p id="email-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? "Sending…" : "Send code"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
