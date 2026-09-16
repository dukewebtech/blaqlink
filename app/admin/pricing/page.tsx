"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, X } from "lucide-react"
import type { PricingPlan } from "@/lib/pricing"

const SELLING_TYPES: { value: string; label: string }[] = [
  { value: "physical", label: "Physical products" },
  { value: "digital", label: "Digital products" },
  { value: "event", label: "Tickets / events" },
  { value: "appointment", label: "Bookings / appointments" },
]

type PlanForm = PricingPlan

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<PlanForm[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/admin/pricing-plans")
        const result = await res.json()
        if (res.ok && result.plans) {
          setPlans(result.plans)
        } else {
          toast({ title: "Error", description: result.error || "Failed to load pricing plans", variant: "destructive" })
        }
      } catch (error) {
        console.error("[v0] Failed to fetch pricing plans:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [toast])

  function updatePlan(index: number, patch: Partial<PlanForm>) {
    setPlans((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  function toggleSellingType(index: number, type: string, checked: boolean) {
    setPlans((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p
        const next = checked ? [...p.allowed_selling_types, type] : p.allowed_selling_types.filter((t) => t !== type)
        return { ...p, allowed_selling_types: next }
      }),
    )
  }

  function updateFeature(index: number, featureIndex: number, value: string) {
    setPlans((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p
        const features = [...p.features]
        features[featureIndex] = value
        return { ...p, features }
      }),
    )
  }

  function addFeature(index: number) {
    setPlans((prev) => prev.map((p, i) => (i === index ? { ...p, features: [...p.features, ""] } : p)))
  }

  function removeFeature(index: number, featureIndex: number) {
    setPlans((prev) =>
      prev.map((p, i) => (i === index ? { ...p, features: p.features.filter((_, fi) => fi !== featureIndex) } : p)),
    )
  }

  async function savePlan(plan: PlanForm) {
    if (plan.allowed_selling_types.length === 0) {
      toast({ title: "Error", description: "At least one selling type must be allowed", variant: "destructive" })
      return
    }

    setSavingId(plan.id)
    try {
      const res = await fetch(`/api/admin/pricing-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: plan.name,
          description: plan.description,
          monthly_fee: Number(plan.monthly_fee),
          transaction_fee_percentage: Number(plan.transaction_fee_percentage),
          transaction_fee_fixed: Number(plan.transaction_fee_fixed),
          product_limit: plan.product_limit === null ? null : Number(plan.product_limit),
          allowed_selling_types: plan.allowed_selling_types,
          features: plan.features.filter((f) => f.trim().length > 0),
          is_popular: plan.is_popular,
          is_active: plan.is_active,
          display_order: plan.display_order,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: "Saved", description: `${plan.name} plan updated. Changes are live on the landing page now.` })
      } else {
        toast({ title: "Error", description: result.error || "Failed to save plan", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Failed to save pricing plan:", error)
      toast({ title: "Error", description: "Failed to save plan", variant: "destructive" })
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading pricing plans...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing Plans</h1>
          <p className="text-muted-foreground">
            Manage what vendors are charged. Changes take effect immediately for new orders and on the landing page.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Card key={plan.id} className={!plan.is_active ? "opacity-60" : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="capitalize">{plan.plan_key}</CardTitle>
                  {plan.is_popular && <Badge>Most Popular</Badge>}
                </div>
                <CardDescription>Plan key is fixed; everything else is editable.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Display name</Label>
                  <Input value={plan.name} onChange={(e) => updatePlan(index, { name: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={plan.description ?? ""}
                    onChange={(e) => updatePlan(index, { description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Monthly fee (₦)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={plan.monthly_fee}
                      onChange={(e) => updatePlan(index, { monthly_fee: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Product limit</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={plan.product_limit ?? ""}
                      onChange={(e) =>
                        updatePlan(index, { product_limit: e.target.value === "" ? null : Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Transaction fee (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={plan.transaction_fee_percentage}
                      onChange={(e) => updatePlan(index, { transaction_fee_percentage: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>+ Fixed fee (₦)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={plan.transaction_fee_fixed}
                      onChange={(e) => updatePlan(index, { transaction_fee_fixed: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Allowed selling types</Label>
                  <div className="space-y-2">
                    {SELLING_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`${plan.id}-${type.value}`}
                          checked={plan.allowed_selling_types.includes(type.value)}
                          onCheckedChange={(checked) => toggleSellingType(index, type.value, checked === true)}
                        />
                        <Label htmlFor={`${plan.id}-${type.value}`} className="font-normal">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Features shown on the pricing card</Label>
                  <div className="space-y-2">
                    {plan.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2">
                        <Input value={feature} onChange={(e) => updateFeature(index, fi, e.target.value)} />
                        <Button variant="ghost" size="icon" onClick={() => removeFeature(index, fi)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => addFeature(index)}>
                      <Plus className="h-4 w-4" />
                      Add feature
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor={`${plan.id}-popular`} className="font-normal">
                    Show "Most Popular" badge
                  </Label>
                  <Switch
                    id={`${plan.id}-popular`}
                    checked={plan.is_popular}
                    onCheckedChange={(checked) => updatePlan(index, { is_popular: checked })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor={`${plan.id}-active`} className="font-normal">
                    Active (visible to vendors and on landing page)
                  </Label>
                  <Switch
                    id={`${plan.id}-active`}
                    checked={plan.is_active}
                    onCheckedChange={(checked) => updatePlan(index, { is_active: checked })}
                  />
                </div>

                <Button className="w-full" onClick={() => savePlan(plan)} disabled={savingId === plan.id}>
                  {savingId === plan.id ? "Saving..." : "Save changes"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
