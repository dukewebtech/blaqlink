"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, ArrowRight, Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react"

export const BANK_NAMES = [
  "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank",
  "FCMB", "GTBank", "Heritage Bank", "Jaiz Bank", "Keystone Bank",
  "Kuda", "Moniepoint", "OPay", "PalmPay", "Parallex Bank",
  "Polaris Bank", "Providus Bank", "Stanbic IBTC", "Standard Chartered",
  "Sterling Bank", "Titan Trust Bank", "UBA", "Union Bank", "VFD Bank",
  "Wema Bank", "Zenith Bank",
]

interface Props {
  onComplete?: () => void
  onSkip?: () => void
  showSkip?: boolean
}

export function IdentityUploadStep({ onComplete, onSkip, showSkip = true }: Props) {
  const [stage, setStage] = useState<"trust" | "form" | "success">("trust")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nin, setNin] = useState("")
  const [fullName, setFullName] = useState("")
  const [dob, setDob] = useState("")

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/kyc/nin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nin, fullName, dateOfBirth: dob }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStage("success")
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Trust screen ─────────────────────────────────────────────────────────────
  if (stage === "trust") {
    return (
      <Card className="p-8 space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Verify your identity to receive payouts</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Blaqora verifies your identity using your NIN to comply with CBN regulations and ensure secure settlements.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
          {[
            { icon: Lock, label: "256-bit encryption" },
            { icon: ShieldCheck, label: "Secure NIN validation" },
            { icon: CheckCircle2, label: "Used only for identity protection" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/40">
              <Icon className="h-4 w-4 text-primary" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full gap-2" onClick={() => setStage("form")}>
            Start Verification <ArrowRight className="h-4 w-4" />
          </Button>
          {showSkip && onSkip && (
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onSkip}>
              Do this later
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // ── Success screen ────────────────────────────────────────────────────────────
  if (stage === "success") {
    return (
      <Card className="p-8 text-center space-y-4 animate-in fade-in duration-300">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold">Identity verified successfully.</h2>
        <p className="text-sm text-muted-foreground">
          You can now connect your bank account to activate withdrawals.
        </p>
        {onComplete && (
          <Button className="w-full mt-2" onClick={onComplete}>
            Continue
          </Button>
        )}
      </Card>
    )
  }

  // ── Verification form ──────────────────────────────────────────────────────────
  return (
    <Card className="p-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Identity Verification</h2>
          <p className="text-xs text-muted-foreground">As required by the CBN for payout activation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="nin">NIN (National Identification Number) <span className="text-destructive">*</span></Label>
          <Input
            id="nin"
            placeholder="11-digit NIN"
            value={nin}
            onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
            inputMode="numeric"
            maxLength={11}
            required
            className="h-11 font-mono tracking-wider"
          />
          <p className="text-xs text-muted-foreground">
            Your 11-digit National Identification Number.{" "}
            <span className="text-amber-600 font-medium">Test mode: use NIN 00000000000</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Legal Full Name <span className="text-destructive">*</span></Label>
          <Input
            id="fullName"
            placeholder="Enter your full legal name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            Enter exactly as it appears on your NIN.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dob">Date of Birth <span className="text-destructive">*</span></Label>
          <Input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
            className="h-11"
            max={new Date().toISOString().split("T")[0]}
          />
          <p className="text-xs text-muted-foreground">
            Enter exactly as registered on your NIN.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setStage("trust")} className="flex-1">
            Back
          </Button>
          <Button
            type="submit"
            className="flex-[2] gap-2"
            disabled={loading || nin.length < 11 || !fullName || !dob}
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : "Verify Identity"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
