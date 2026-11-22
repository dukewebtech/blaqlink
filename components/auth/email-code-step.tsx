"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const RESEND_SECONDS = 60

/** Digits only; Supabase codes are 6 (or 8, if the project is set that way). */
export function CodeInput({ id, value, onChange, error }: { id: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Code from your email</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        className="h-14 text-center font-mono text-2xl tracking-[0.4em]"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoFocus
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function friendlyError(message: string) {
  const m = message.toLowerCase()
  if (m.includes("expired") || m.includes("invalid")) return "That code is wrong or has expired. Check the latest email, or send a new code."
  if (m.includes("rate") || m.includes("too many")) return "Too many tries. Wait a minute, then try again."
  return "We couldn't check that code. Please try again."
}

/**
 * Second half of sign-up: the 6-digit code Supabase emails. A correct code
 * signs the person in, so they go straight on without logging in again.
 */
export function EmailCodeStep({
  email,
  sentOnArrival = true,
  onVerified,
  onChangeEmail,
}: {
  email: string
  /** false when we arrive here without having just sent a code (e.g. from login) */
  sentOnArrival?: boolean
  onVerified: () => void
  onChangeEmail?: () => void
}) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [cooldown, setCooldown] = useState(sentOnArrival ? RESEND_SECONDS : 0)
  const submitted = useRef("")

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function verify(token: string) {
    if (token.length < 6 || submitted.current === token) return
    submitted.current = token
    setChecking(true)
    setError(null)
    const { error: verifyError } = await createClient().auth.verifyOtp({ email, token, type: "email" })
    setChecking(false)
    if (verifyError) {
      setError(friendlyError(verifyError.message))
      return
    }
    onVerified()
  }

  // Submit by itself once a full 6-digit code is typed or pasted.
  useEffect(() => {
    if (code.length === 6) verify(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  async function resend() {
    setError(null)
    setNotice(null)
    const { error: resendError } = await createClient().auth.resend({ type: "signup", email })
    if (resendError) {
      setError(resendError.message.toLowerCase().includes("rate") ? "Please wait a minute before asking for another code." : "We couldn't send a new code. Please try again.")
      return
    }
    submitted.current = ""
    setCode("")
    setCooldown(RESEND_SECONDS)
    setNotice("New code sent. Check your inbox and spam folder.")
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        submitted.current = ""
        verify(code)
      }}
    >
      <div className="flex gap-3 rounded-lg border bg-muted/30 p-4">
        <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm">
          {sentOnArrival ? "We sent a 6-digit code to " : "Confirm your email to continue. We'll send a code to "}
          <strong className="break-all">{email}</strong>.{sentOnArrival && " It can take a minute to arrive."}
        </p>
      </div>

      <CodeInput id="code" value={code} onChange={setCode} error={error ?? undefined} />

      {notice && (
        <p role="status" className="text-sm text-green-700">
          {notice}
        </p>
      )}

      <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={checking || code.length < 6}>
        {checking && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {checking ? "Checking…" : "Confirm email"}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" onClick={resend} disabled={cooldown > 0} className="font-medium text-primary disabled:text-muted-foreground">
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : sentOnArrival ? "Send a new code" : "Send code"}
        </button>
        {onChangeEmail && (
          <button type="button" onClick={onChangeEmail} className="font-medium text-muted-foreground hover:text-foreground">
            Use a different email
          </button>
        )}
      </div>
    </form>
  )
}
