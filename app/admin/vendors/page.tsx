"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ExternalLink, Store, Package, DollarSign } from "lucide-react"
import Link from "next/link"

interface Vendor {
  id: string
  full_name: string
  business_name: string
  email: string
  phone: string
  created_at: string
  total_products: number
  total_orders: number
  total_revenue: number
  plan_id: string | null
  pricing_plans: { id: string; name: string; plan_key: string } | null
}

interface PlanOption {
  id: string
  name: string
  plan_key: string
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingVendorId, setUpdatingVendorId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchVendors() {
      try {
        const [vendorsResponse, plansResponse] = await Promise.all([
          fetch("/api/admin/vendors"),
          fetch("/api/admin/pricing-plans"),
        ])
        if (!vendorsResponse.ok) throw new Error("Failed to fetch vendors")
        const data = await vendorsResponse.json()
        setVendors(data.vendors || [])

        if (plansResponse.ok) {
          const plansData = await plansResponse.json()
          setPlans(plansData.plans || [])
        }
      } catch (error) {
        console.error("[v0] Failed to fetch vendors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])

  async function handlePlanChange(vendorId: string, planId: string) {
    setUpdatingVendorId(vendorId)
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      })
      const result = await response.json()
      if (response.ok) {
        const plan = plans.find((p) => p.id === planId)
        setVendors((prev) =>
          prev.map((v) => (v.id === vendorId ? { ...v, plan_id: planId, pricing_plans: plan ?? v.pricing_plans } : v)),
        )
        toast({ title: "Plan updated", description: `Vendor moved to the ${plan?.name} plan.` })
      } else {
        toast({ title: "Error", description: result.error || "Failed to update plan", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Failed to update vendor plan:", error)
      toast({ title: "Error", description: "Failed to update plan", variant: "destructive" })
    } finally {
      setUpdatingVendorId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading vendors...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors & Stores</h1>
          <p className="text-muted-foreground">Manage all vendors and their stores</p>
        </div>

        <div className="grid gap-4">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {vendor.business_name || vendor.full_name}
                    </CardTitle>
                    <CardDescription>{vendor.email}</CardDescription>
                  </div>
                  <Link href={`/store/${vendor.id}`} target="_blank">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <ExternalLink className="h-4 w-4" />
                      View Store
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{vendor.total_products}</p>
                      <p className="text-xs text-muted-foreground">Products</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{vendor.total_orders}</p>
                      <p className="text-xs text-muted-foreground">Orders</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{formatCurrency(vendor.total_revenue)}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 border-t pt-4">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <Select
                    value={vendor.plan_id ?? undefined}
                    onValueChange={(value) => handlePlanChange(vendor.id, value)}
                    disabled={updatingVendorId === vendor.id}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Assign a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
