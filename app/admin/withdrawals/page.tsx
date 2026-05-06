"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Withdrawal {
  id: string
  amount: number
  status: string
  bank_name: string
  account_number: string
  account_name: string
  created_at: string
  vendor_name: string
  vendor_business: string
  vendor_email: string
  payout_gateway: string | null
  kora_payout_reference: string | null
  kora_payout_status: string | null
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [checking, setChecking] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => { fetchWithdrawals() }, [])

  async function fetchWithdrawals() {
    try {
      const res = await fetch("/api/admin/withdrawals")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setWithdrawals(data.withdrawals || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to approve withdrawal")
      toast({ title: "Payout Sent", description: `KoraPay reference: ${data.kora_payout_reference ?? "—"}` })
      await fetchWithdrawals()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setProcessing(null)
    }
  }

  async function handleReject(id: string) {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })
      if (!res.ok) throw new Error("Failed to reject withdrawal")
      toast({ title: "Withdrawal Rejected" })
      await fetchWithdrawals()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setProcessing(null)
    }
  }

  async function handleCheckStatus(id: string) {
    setChecking(id)
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/payout-status`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to check status")

      const koraStatus: string = data.kora_status ?? "unknown"
      const color = koraStatus === "success" ? "text-green-600" : koraStatus === "failed" ? "text-red-600" : "text-yellow-600"

      toast({
        title: "KoraPay Payout Status",
        description: (
          <div className="space-y-1 text-sm mt-1">
            <div><span className="text-muted-foreground">Reference: </span><span className="font-mono">{data.kora_reference}</span></div>
            <div><span className="text-muted-foreground">Status: </span><span className={`font-bold ${color}`}>{koraStatus.toUpperCase()}</span></div>
            {data.kora_message && <div><span className="text-muted-foreground">Message: </span>{data.kora_message}</div>}
            {data.completion_date && <div><span className="text-muted-foreground">Completed: </span>{new Date(data.completion_date).toLocaleString()}</div>}
          </div>
        ) as any,
      })

      await fetchWithdrawals()
    } catch (error: any) {
      toast({ title: "Status Check Failed", description: error.message, variant: "destructive" })
    } finally {
      setChecking(null)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount)

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: "bg-green-100 text-green-800",
      pending:  "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
    }
    return map[status.toLowerCase()] ?? "bg-gray-100 text-gray-800"
  }

  const koraStatusBadge = (s: string | null) => {
    if (!s) return null
    const map: Record<string, string> = {
      success:    "bg-green-100 text-green-700",
      failed:     "bg-red-100 text-red-700",
      processing: "bg-blue-100 text-blue-700",
    }
    return (
      <Badge className={`text-xs ${map[s] ?? "bg-gray-100 text-gray-600"}`}>
        {s === "failed" && <AlertCircle className="w-3 h-3 mr-1 inline" />}
        KP: {s}
      </Badge>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading withdrawals…</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Withdrawal Requests</h1>
          <p className="text-muted-foreground">Review and process vendor withdrawal requests via KoraPay</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Requests ({withdrawals.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payout Ref</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No withdrawal requests yet
                    </TableCell>
                  </TableRow>
                )}
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <p className="font-medium">{w.vendor_business || w.vendor_name}</p>
                      <p className="text-xs text-muted-foreground">{w.vendor_email}</p>
                    </TableCell>

                    <TableCell className="font-medium">{formatCurrency(w.amount)}</TableCell>

                    <TableCell>
                      <p className="text-sm font-medium">{w.bank_name}</p>
                      <p className="text-xs text-muted-foreground">{w.account_number}</p>
                      <p className="text-xs text-muted-foreground">{w.account_name}</p>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={statusBadge(w.status)}>{w.status}</Badge>
                        {koraStatusBadge(w.kora_payout_status)}
                      </div>
                    </TableCell>

                    <TableCell>
                      {w.kora_payout_reference ? (
                        <span className="font-mono text-xs text-muted-foreground break-all">
                          {w.kora_payout_reference}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {new Date(w.created_at).toLocaleDateString()}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {w.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(w.id)}
                              disabled={processing === w.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve &amp; Pay
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(w.id)}
                              disabled={processing === w.id}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {w.kora_payout_reference && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckStatus(w.id)}
                            disabled={checking === w.id}
                            className="gap-1.5 text-xs"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${checking === w.id ? "animate-spin" : ""}`} />
                            Check Payout Status
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
