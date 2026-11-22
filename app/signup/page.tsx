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
import { PasswordField, MIN_PASSWORD_LENGTH } from "@/components/auth/password-field"
import { EmailCodeStep } from "@/components/auth/email-code-step"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  )
}

type Errors = Partial<Record<"fullName" | "storeName" | "email" | "password" | "form", string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}

/**
 * Sign-up in two steps on one page: details, then the 6-digit code emailed
 * by Supabase. A correct code signs the vendor in and goes straight to store
 * setup, so nobody has to log in again.
 */
function SignupForm() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<"details" | "code">("details")
  const [fullName, setFullName] = useState("")
  const [storeName, setStoreName] = useState(() => searchParams.get("store") || "")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Errors>({})
  const [existingAccount, setExistingAccount] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const slug = toSlug(storeName)

  function validate(): Errors {
    const e: Errors = {}
    if (!fullName.trim()) e.fullName = "Enter your name."
    if (!storeName.trim()) e.storeName = "Give your store a name. You can change it later."
    else if (!slug) e.storeName = "Use at least one letter or number."
    if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address, like you@example.com."
    if (password.length < MIN_PASSWORD_LENGTH) e.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    return e
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setExistingAccount(false)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await createClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim(), store_name: storeName.trim() },
          // Only used if the email still has a plain link instead of a code.
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      })

      if (error) {
        const m = error.message.toLowerCase()
        if (m.includes("already registered") || m.includes("already exists")) setExistingAccount(true)
        else if (m.includes("rate limit") || m.includes("too many")) setErrors({ form: "Too many sign-up attempts. Please wait a few minutes and try again." })
        else if (m.includes("password")) setErrors({ password: "Choose a stronger password: longer, and not one you use elsewhere." })
        else if (m.includes("email")) setErrors({ email: "We can't use that email address. Check it and try again." })
        else setErrors({ form: "We couldn't create your account. Please try again." })
        return
      }

      // Email checks switched off: already signed in.
      if (data.session) {
        window.location.href = "/onboarding"
        return
      }
      // Supabase hides whether an email is taken; a confirmed account comes back with no identities.
      if (data.user && data.user.identities?.length === 0) {
        setExistingAccount(true)
        return
      }
      setStep("code")
      window.scrollTo({ top: 0 })
    } catch {
      setErrors({ form: "We couldn't reach the server. Check your connection and try again." })
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "code") {
    return (
      <AuthShell title="Check your email" subtitle="One last step to create your account.">
        <EmailCodeStep
          email={email.trim()}
          onVerified={() => {
            window.location.href = "/onboarding"
          }}
          onChangeEmail={() => setStep("details")}
        />
      </AuthShell>
    )
  }

  const invalid = (key: keyof Errors) =>
    errors[key] ? { "aria-invalid": true as const, "aria-describedby": `${key}-error` } : {}

  return (
    <AuthShell title="Sign up" subtitle="Create your store in a few minutes. It's free to start.">
      <form onSubmit={handleSignup} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="fullName">Your name</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="e.g. Ada Okafor" className="h-12" {...invalid("fullName")} />
          <FieldError id="fullName" message={errors.fullName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="storeName">Store name</Label>
          <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} autoComplete="organization" placeholder="e.g. Ada Bakes" maxLength={80} className="h-12" {...invalid("storeName")} />
          {!errors.storeName && slug && <p className="text-xs text-muted-foreground">Your link: blaqora.store/{slug}</p>}
          <FieldError id="storeName" message={errors.storeName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setExistingAccount(false)
            }}
            placeholder="you@example.com"
            className="h-12"
            {...invalid("email")}
          />
          <FieldError id="email" message={errors.email} />
        </div>

        <PasswordField value={password} onChange={setPassword} autoComplete="new-password" error={errors.password} showHint />

        {existingAccount && (
          <div role="alert" className="space-y-3 rounded-lg border p-4">
            <p className="text-sm">
              <strong>{email.trim()}</strong> already has a Blaqora account.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/login?email=${encodeURIComponent(email.trim())}`}>Log in</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/forgot-password?email=${encodeURIComponent(email.trim())}`}>Reset password</Link>
              </Button>
            </div>
          </div>
        )}

        {errors.form && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {errors.form}
          </p>
        )}

        <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  )
}
