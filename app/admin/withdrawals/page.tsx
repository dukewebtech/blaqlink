"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X } from "lucide-react"
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
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  async function fetchWithdrawals() {
    try {
      const response = await fetch("/api/admin/withdrawals")
      if (!response.ok) throw new Error("Failed to fetch withdrawals")
      const data = await response.json()
      setWithdrawals(data.withdrawals || [])
    } catch (error) {
      console.error("[v0] Failed to fetch withdrawals:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    setProcessing(id)
    try {
      const response = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })

      if (!response.ok) throw new Error("Failed to approve withdrawal")

      toast({
        title: "Withdrawal Approved",
        description: "The withdrawal request has been approved successfully.",
      })

      await fetchWithdrawals()
    } catch (error) {
      console.error("[v0] Failed to approve withdrawal:", error)
      toast({
        title: "Error",
        description: "Failed to approve withdrawal request.",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  async function handleReject(id: string) {
    setProcessing(id)
    try {
      const response = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (!response.ok) throw new Error("Failed to reject withdrawal")

      toast({
        title: "Withdrawal Rejected",
        description: "The withdrawal request has been rejected.",
      })

      await fetchWithdrawals()
    } catch (error) {
      console.error("[v0] Failed to reject withdrawal:", error)
      toast({
        title: "Error",
        description: "Failed to reject withdrawal request.",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading withdrawals...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Withdrawal Requests</h1>
          <p className="text-muted-foreground">Review and process vendor withdrawal requests</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Requests ({withdrawals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{withdrawal.vendor_business || withdrawal.vendor_name}</p>
                        <p className="text-xs text-muted-foreground">{withdrawal.vendor_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(withdrawal.amount)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{withdrawal.bank_name}</p>
                        <p className="text-muted-foreground">{withdrawal.account_number}</p>
                        <p className="text-muted-foreground">{withdrawal.account_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(withdrawal.status)}>{withdrawal.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(withdrawal.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {withdrawal.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(withdrawal.id)}
                            disabled={processing === withdrawal.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(withdrawal.id)}
                            disabled={processing === withdrawal.id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
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
