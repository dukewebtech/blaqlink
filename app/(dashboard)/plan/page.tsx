"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PricingCalculator } from "@/components/pricing-calculator"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2 } from "lucide-react"
import type { PricingPlan } from "@/lib/pricing"

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function PlanPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestingPlanId, setRequestingPlanId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, userRes] = await Promise.all([fetch("/api/pricing-plans"), fetch("/api/users/me")])
        const plansData = await plansRes.json()
        if (plansRes.ok) setPlans(plansData.plans || [])

        const userData = await userRes.json()
        if (userRes.ok) setCurrentPlanId(userData.data?.user?.plan_id || null)
      } catch (error) {
        console.error("[v0] Failed to load plan data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function requestUpgrade(plan: PricingPlan) {
    setRequestingPlanId(plan.id)
    try {
      const res = await fetch("/api/plan/request-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requested_plan_id: plan.id }),
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: "Request sent", description: `We've notified the team about your request to move to ${plan.name}.` })
      } else {
        toast({ title: "Error", description: result.error || "Failed to send request", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Failed to request plan upgrade:", error)
      toast({ title: "Error", description: "Failed to send request", variant: "destructive" })
    } finally {
      setRequestingPlanId(null)
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading plans...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Plan & Billing</h1>
          <p className="text-muted-foreground">See your current plan, compare options, and estimate costs.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId
            return (
              <Card key={plan.id} className={isCurrent ? "border-primary border-2" : undefined}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{plan.name}</CardTitle>
                    {isCurrent && <Badge>Current Plan</Badge>}
                    {!isCurrent && plan.is_popular && <Badge variant="secondary">Most Popular</Badge>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold">
                      {formatNaira(plan.monthly_fee)}
                      <span className="text-sm font-normal text-muted-foreground"> / month</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.transaction_fee_percentage}%
                      {plan.transaction_fee_fixed > 0 ? ` + ${formatNaira(plan.transaction_fee_fixed)}` : ""} per sale
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || requestingPlanId === plan.id}
                    onClick={() => requestUpgrade(plan)}
                  >
                    {isCurrent ? "Your current plan" : requestingPlanId === plan.id ? "Sending request..." : `Request ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {plans.length > 0 && <PricingCalculator plans={plans} />}
      </div>
    </>
  )
}
