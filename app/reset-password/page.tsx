"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth/auth-shell"
import { PasswordField, MIN_PASSWORD_LENGTH } from "@/components/auth/password-field"
import { createClient } from "@/lib/supabase/client"

/** Where a password-reset link lands (signed in by /auth/confirm). */
export default function ResetPasswordPage() {
  const [state, setState] = useState<"checking" | "ready" | "expired">("checking")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setState(data.user ? "ready" : "expired"))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    setSaving(true)
    const { error: updateError } = await createClient().auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      return setError(updateError.message.toLowerCase().includes("different") ? "Choose a password you haven't used before." : "We couldn't save that password. Try a longer one.")
    }
    window.location.href = "/dashboard"
  }

  if (state === "checking") {
    return (
      <AuthShell title="Choose a new password">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </AuthShell>
    )
  }

  if (state === "expired") {
    return (
      <AuthShell title="This link has expired" subtitle="Reset links work once and for a limited time.">
        <Button asChild className="h-12 w-full text-base font-semibold">
          <Link href="/forgot-password">Send a new code</Link>
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={save} className="space-y-5" noValidate>
        <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" error={error ?? undefined} showHint />
        <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthShell>
  )
}
