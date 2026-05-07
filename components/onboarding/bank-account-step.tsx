"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Banknote, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { BANK_NAMES } from "@/components/onboarding/identity-upload-step"

interface Props {
  onNext: () => void
}

export function BankAccountStep({ onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [resolvedAccountName, setResolvedAccountName] = useState("")

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
    setLoading(true)
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
      if (!res.ok) throw new Error("Failed to save bank information")
      onNext()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <Banknote className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Where should we send your earnings?</h2>
          <p className="text-sm text-muted-foreground">Add your payout account. You can update this anytime in settings.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Bank Name <span className="text-destructive">*</span></Label>
          <Select value={bankName} onValueChange={handleBankChange} required>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select your bank" />
            </SelectTrigger>
            <SelectContent>
              {BANK_NAMES.map((b: string) => (
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
            className="h-11 font-mono tracking-wider"
          />
        </div>

        {resolving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking up account…
          </div>
        )}

        {resolvedAccountName && !resolving && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Account Name</p>
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
          disabled={loading || resolving || !resolvedAccountName}
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Saving…</>
          ) : (
            <>Save Payout Account <ArrowRight className="h-5 w-5" /></>
          )}
        </Button>
      </form>
    </Card>
  )
}
