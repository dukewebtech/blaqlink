"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowUpRight, CheckCircle2, Clock, Loader2, Search, ShieldAlert, TrendingUp, Wallet, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatNaira } from "@/lib/money"

interface Summary {
  earned: number
  available: number
  withdrawn: number
  pending: number
  minimum: number
  verified: boolean
  bank: { bank_name: string; account_number_last4: string; account_name: string } | null
}

interface Withdrawal {
  id: string
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  status: string
  admin_notes: string | null
  created_at: string
}

const STATUS: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  approved: { label: "Sending", icon: ArrowUpRight, className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  completed: { label: "Paid", icon: CheckCircle2, className: "bg-green-100 text-green-800 hover:bg-green-100" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-100 text-red-800 hover:bg-red-100" },
  failed: { label: "Failed", icon: XCircle, className: "bg-red-100 text-red-800 hover:bg-red-100" },
}

const dateFormat = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })

export default function PayoutsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [amountError, setAmountError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setState("loading")
    try {
      const [s, w] = await Promise.all([fetch("/api/payouts/summary"), fetch("/api/withdrawals")])
      if (!s.ok || !w.ok) throw new Error()
      setSummary(await s.json())
      setWithdrawals((await w.json()).withdrawals ?? [])
      setState("ready")
    } catch {
      setState("error")
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const canWithdraw = !!summary?.verified && !!summary.bank
  const filtered = withdrawals.filter((w) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [w.bank_name, w.account_name, STATUS[w.status]?.label ?? w.status].some((v) => v?.toLowerCase().includes(q))
  })

  async function submit() {
    if (!summary) return
    const value = Number(amount)
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) return setAmountError("Enter how much to withdraw.")
    if (value < summary.minimum) return setAmountError(`The minimum withdrawal is ${formatNaira(summary.minimum)}.`)
    if (value > summary.available) return setAmountError(`You can withdraw up to ${formatNaira(Math.max(summary.available, 0))}.`)
    setAmountError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAmountError(data.error ?? "We couldn't create your withdrawal. Please try again.")
        return
      }
      setOpen(false)
      setAmount("")
      toast.success(data.auto_disbursed ? "Withdrawal sent to your bank" : "Withdrawal requested", {
        description: data.auto_disbursed ? "It usually arrives within minutes." : "We'll email you when it's paid.",
      })
      load()
    } catch {
      setAmountError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const stat = (label: string, value: number | undefined, icon: React.ReactNode, hint?: string, highlight = false) => (
    <Card className={highlight ? "p-5 bg-primary text-primary-foreground border-0" : "p-5"}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className={highlight ? "text-sm text-primary-foreground/85" : "text-sm text-muted-foreground"}>{label}</p>
          <p className="text-2xl md:text-3xl font-bold tabular-nums truncate">
            {state === "loading" || value === undefined ? <span className="inline-block h-8 w-28 animate-pulse rounded bg-current/10" /> : formatNaira(value)}
          </p>
          {hint && <p className={highlight ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>{hint}</p>}
        </div>
        {icon}
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Payouts</h1>
          <p className="text-sm text-muted-foreground">Withdraw what you've earned to your verified bank account.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/payout">Payout settings</Link>
          </Button>
          <Button onClick={() => setOpen(true)} disabled={state !== "ready"}>
            Withdraw
          </Button>
        </div>
      </div>

      {state === "error" && (
        <Card className="p-6 text-center space-y-3" role="alert">
          <p className="font-semibold">Your balance didn't load</p>
          <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
          <Button onClick={load}>Try again</Button>
        </Card>
      )}

      {state !== "error" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stat("Available to withdraw", summary?.available, <Wallet className="h-5 w-5 shrink-0" aria-hidden="true" />, summary ? `Minimum ${formatNaira(summary.minimum)}` : undefined, true)}
          {stat("Earned after fees", summary?.earned, <TrendingUp className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />)}
          {stat("Paid out", summary?.withdrawn, <CheckCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />)}
          {stat("Pending", summary?.pending, <Clock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />)}
        </div>
      )}

      {state === "ready" && !canWithdraw && (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-amber-300 bg-amber-50">
          <div className="flex gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <p className="font-medium">{summary?.verified ? "Add your bank account" : "Verify your identity to withdraw"}</p>
              <p className="text-sm text-muted-foreground">
                {summary?.verified
                  ? "Payouts go to a bank account in your verified name."
                  : "We check your NIN once, then pay out only to a bank account in that name."}
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/settings/payout">{summary?.verified ? "Add bank account" : "Verify now"}</Link>
          </Button>
        </Card>
      )}

      <Card className="p-5 md:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Withdrawal history</h2>
          {withdrawals.length > 0 && (
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input className="pl-9" placeholder="Search" aria-label="Search withdrawals" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
        </div>

        {state === "loading" && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading withdrawals">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {state === "ready" && withdrawals.length === 0 && (
          <div className="py-10 text-center space-y-2">
            <Wallet className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="font-semibold">No withdrawals yet</p>
            <p className="text-sm text-muted-foreground">When you withdraw, each payout and its status appears here.</p>
            <Button className="mt-2" onClick={() => setOpen(true)}>
              Withdraw
            </Button>
          </div>
        )}

        {state === "ready" && withdrawals.length > 0 && filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No withdrawals match "{search}".</p>
        )}

        {state === "ready" && filtered.length > 0 && (
          <ul className="divide-y">
            {filtered.map((w) => {
              const s = STATUS[w.status] ?? { label: w.status, icon: Clock, className: "" }
              const Icon = s.icon
              return (
                <li key={w.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {w.bank_name} •••• {w.account_number.slice(-4)}
                    </p>
                    <p className="text-sm text-muted-foreground">{dateFormat.format(new Date(w.created_at))}</p>
                    {w.admin_notes && <p className="text-sm text-muted-foreground">{w.admin_notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                    <span className="font-semibold tabular-nums">{formatNaira(w.amount)}</span>
                    <Badge className={s.className}>
                      <Icon className="mr-1 h-3 w-3" aria-hidden="true" />
                      {s.label}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setAmountError(null)
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw to your bank</DialogTitle>
            <DialogDescription>
              {summary ? `You can withdraw up to ${formatNaira(Math.max(summary.available, 0))}. Minimum ${formatNaira(summary.minimum)}.` : ""}
            </DialogDescription>
          </DialogHeader>

          {!canWithdraw ? (
            <div className="space-y-3">
              <p className="text-sm">
                {summary?.verified ? "Add a bank account in your verified name before withdrawing." : "Verify your identity before withdrawing."}
              </p>
              <Button asChild className="w-full">
                <Link href="/settings/payout">{summary?.verified ? "Add bank account" : "Verify now"}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  min={summary?.minimum}
                  max={summary?.available}
                  className="tabular-nums"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-invalid={!!amountError}
                  aria-describedby={amountError ? "amount-error" : undefined}
                />
                {summary && summary.available >= summary.minimum && (
                  <button type="button" className="text-sm font-medium text-primary" onClick={() => setAmount(String(summary.available))}>
                    Withdraw all ({formatNaira(summary.available)})
                  </button>
                )}
                {amountError && (
                  <p id="amount-error" role="alert" className="text-sm text-destructive">
                    {amountError}
                  </p>
                )}
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Paid to</p>
                <p className="font-medium">
                  {summary!.bank!.bank_name} •••• {summary!.bank!.account_number_last4}
                </p>
                <p className="text-muted-foreground">{summary!.bank!.account_name}</p>
                <Link href="/settings/payout" className="text-primary font-medium">
                  Change account
                </Link>
              </div>
            </div>
          )}

          {canWithdraw && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Withdraw
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
