"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, ArrowRight, Loader2, AlertCircle } from "lucide-react"

interface Props {
  onNext: () => void
}

const nigerianBanks = [
  "Access Bank",
  "Citibank",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Keystone Bank",
  "Parallex Bank",
  "Polaris Bank",
  "Premium Trust Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Titan Trust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
]

export function BankAccountStep({ onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 4,
          data: formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save bank information")
      }

      onNext()
    } catch (error) {
      console.error("[v0] Error saving bank information:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Bank Account Setup</h2>
          <p className="text-sm text-muted-foreground">Connect your payout account</p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 mb-6">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-600 dark:text-amber-400">
            <p className="font-medium mb-1">This will be your primary payout account</p>
            <p className="text-xs">
              All withdrawals will be sent to this account. You can update it later in settings.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="bankName">Bank Name *</Label>
          <Select
            required
            value={formData.bankName}
            onValueChange={(value) => setFormData({ ...formData, bankName: value })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select your bank" />
            </SelectTrigger>
            <SelectContent>
              {nigerianBanks.map((bank) => (
                <SelectItem key={bank} value={bank}>
                  {bank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number *</Label>
          <Input
            id="accountNumber"
            placeholder="Enter your 10-digit account number"
            required
            maxLength={10}
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, "") })}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountName">Account Name *</Label>
          <Input
            id="accountName"
            placeholder="Enter account holder name"
            required
            value={formData.accountName}
            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">Must match the name on your bank account</p>
        </div>

        <div className="rounded-lg bg-muted/50 p-4 border">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Automatic account verification will be added in a future update. For now, please
            ensure your account details are correct.
          </p>
        </div>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
