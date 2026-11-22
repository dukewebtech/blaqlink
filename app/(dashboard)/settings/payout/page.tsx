"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { toast } from "sonner"
import { Banknote, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react"
import { BANK_NAMES } from "@/components/onboarding/identity-upload-step"
import { useVendorUser } from "@/components/dashboard/vendor-user-context"
import { bankNameMatches as namesMatch } from "@/lib/kyc/nin-match"

export default function PayoutSettingsPage() {
  const { user: vendorUser, loading: loadingVendorUser, refetch: refetchVendorUser } = useVendorUser()
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [resolvedAccountName, setResolvedAccountName] = useState("")
  const [resolving, setResolving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A saved account shows as a summary; "Change" opens the form again.
  const [editing, setEditing] = useState(false)
  const [verifiedName, setVerifiedName] = useState<string | null>(null)
  // undefined = not yet loaded, so the ?? fallback to vendorUser below can't
  // fire prematurely with a false-negative while /api/onboarding is in flight.
  const [progressKycCompleted, setProgressKycCompleted] = useState<boolean | undefined>(undefined)
  const [loadingProgress, setLoadingProgress] = useState(true)

  const loadingProfile = loadingVendorUser || loadingProgress
  // Preserves the original precedence exactly: prefer onboarding progress's
  // flag when it's defined, otherwise fall back to the user row's own flag.
  const isVerified = progressKycCompleted ?? vendorUser?.payout_verified ?? false

  // Onboarding progress isn't part of the shared vendor user — fetched once here.
  useEffect(() => {
    async function loadProgress() {
      try {
        const progressRes = await fetch("/api/onboarding")
        const progressData = progressRes.ok ? await progressRes.json() : null
        const progress = progressData?.progress ?? {}
        setProgressKycCompleted(progress.kyc_info_completed)
      } catch (e) {
        console.error("[payout] progress load error", e)
      } finally {
        setLoadingProgress(false)
      }
    }
    loadProgress()
  }, [])

  // Populates from the shared vendor user (replaces this page's own fetch to
  // /api/users/me) whenever it loads or changes.
  useEffect(() => {
    if (vendorUser) {
      setVerifiedName(vendorUser.legal_name ?? null)
      if (vendorUser.bank_name) setBankName(vendorUser.bank_name)
      if (vendorUser.account_number) setAccountNumber(vendorUser.account_number)
      if (vendorUser.account_name) setResolvedAccountName(vendorUser.account_name)
    }
  }, [vendorUser])

  async function resolveAccount(bank: string, account: string) {
    if (account.length !== 10 || !bank) return
    setResolving(true)
    setResolvedAccountName("")
    setError(null)
    try {
      const res = await fetch("/api/payment/korapay/resolve-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank_name: bank, account_number: account }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (verifiedName && !namesMatch(data.account_name, verifiedName)) {
        setError(
          `The bank account name ("${data.account_name}") does not match your verified identity name ("${verifiedName}"). Please use a bank account registered in your legal name.`,
        )
        return
      }

      setResolvedAccountName(data.account_name)
    } catch (err: any) {
      setError(err.message || "Could not resolve account. Check the number and try again.")
    } finally {
      setResolving(false)
    }
  }

  function handleAccountNumberChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10)
    setAccountNumber(digits)
    setResolvedAccountName("")
    setError(null)
    if (digits.length === 10) resolveAccount(bankName, digits)
  }

  function handleBankChange(value: string) {
    setBankName(value)
    setResolvedAccountName("")
    setError(null)
    if (accountNumber.length === 10) resolveAccount(value, accountNumber)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!resolvedAccountName) {
      setError("Please wait for account verification to complete.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "bank",
          data: { bankName, accountNumber, accountName: resolvedAccountName },
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "We couldn't save your bank account. Please try again.")
      }
      await refetchVendorUser()
      setEditing(false)
      toast.success("Payout account saved")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loadingProfile) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payout Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect a bank account to receive withdrawals.</p>
        </div>

        {!isVerified && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Identity verification required</p>
              <p className="text-xs mt-0.5 text-amber-700">
                You must verify your identity before connecting a payout account.{" "}
                <a href="/settings/verify" className="underline font-medium">Verify now →</a>
              </p>
            </div>
          </div>
        )}

        {vendorUser?.account_number && vendorUser?.account_name && !editing ? (
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-700" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Payout account connected</h2>
                <p className="text-xs text-muted-foreground">Withdrawals are paid into this account.</p>
              </div>
            </div>
            <dl className="divide-y rounded-lg border text-sm">
              <div className="flex justify-between gap-4 p-3">
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="text-right font-medium">{vendorUser.bank_name}</dd>
              </div>
              <div className="flex justify-between gap-4 p-3">
                <dt className="text-muted-foreground">Account number</dt>
                <dd className="font-mono font-medium tabular-nums">{vendorUser.account_number}</dd>
              </div>
              <div className="flex justify-between gap-4 p-3">
                <dt className="text-muted-foreground">Account name</dt>
                <dd className="text-right font-medium">{vendorUser.account_name}</dd>
              </div>
            </dl>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild size="lg">
                <Link href="/payouts">Go to payouts</Link>
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => setEditing(true)}>
                Change account
              </Button>
            </div>
          </Card>
        ) : (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Bank Account Details</h2>
              <p className="text-xs text-muted-foreground">Account must be in your legal name.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Bank Name <span className="text-destructive">*</span></Label>
              <Select value={bankName} onValueChange={handleBankChange} disabled={!isVerified} required>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {BANK_NAMES.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accountNumber">Account Number <span className="text-destructive">*</span></Label>
              <Input
                id="accountNumber"
                placeholder="10-digit account number"
                value={accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                maxLength={10}
                inputMode="numeric"
                required
                disabled={!isVerified}
                className="h-11 font-mono tracking-wider"
              />
            </div>

            {resolving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying account…
              </div>
            )}

            {resolvedAccountName && !resolving && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Verified Account Name</p>
                  <p className="text-sm font-semibold text-green-800">{resolvedAccountName}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={saving || resolving || !resolvedAccountName || !isVerified}
            >
              {saving ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Saving…</>
              ) : (
                "Save payout account"
              )}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" className="w-full" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </form>
        </Card>
        )}
      </div>
    </>
  )
}
