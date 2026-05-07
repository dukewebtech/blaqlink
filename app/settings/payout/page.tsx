"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Banknote, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react"
import { BANK_NAMES } from "@/components/onboarding/identity-upload-step"

function normalize(name: string) {
  return name.toUpperCase().replace(/\s+/g, " ").trim()
}

function namesMatch(a: string, b: string): boolean {
  const words = normalize(a).split(" ").filter(Boolean)
  const target = normalize(b)
  const matchCount = words.filter((w) => target.includes(w)).length
  return matchCount / words.length >= 0.5
}

export default function PayoutSettingsPage() {
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [resolvedAccountName, setResolvedAccountName] = useState("")
  const [resolving, setResolving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [verifiedName, setVerifiedName] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, progressRes] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/onboarding"),
        ])
        const profileData = profileRes.ok ? await profileRes.json() : null
        const progressData = progressRes.ok ? await progressRes.json() : null

        const user = profileData?.data?.user ?? {}
        const progress = progressData?.progress ?? {}

        const kycDone = progress.kyc_info_completed ?? user.payout_verified ?? false
        setIsVerified(kycDone)
        setVerifiedName(user.legal_name ?? null)

        if (user.bank_name) setBankName(user.bank_name)
        if (user.account_number) setAccountNumber(user.account_number)
        if (user.account_name) setResolvedAccountName(user.account_name)
      } catch (e) {
        console.error("[payout] load error", e)
      } finally {
        setLoadingProfile(false)
      }
    }
    load()
  }, [])

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
      if (!res.ok) throw new Error("Failed to save bank information. Please try again.")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
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
              ) : saved ? (
                <><CheckCircle2 className="h-5 w-5" /> Saved!</>
              ) : (
                "Save Payout Account"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
