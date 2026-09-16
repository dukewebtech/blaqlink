"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator } from "lucide-react"
import type { PricingPlan } from "@/lib/pricing"

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function PricingCalculator({ plans }: { plans: PricingPlan[] }) {
  const [monthlySales, setMonthlySales] = useState("200000")
  const [orderCount, setOrderCount] = useState("20")

  const results = useMemo(() => {
    const volume = Math.max(0, Number(monthlySales) || 0)
    const orders = Math.max(0, Number(orderCount) || 0)

    const costs = plans.map((plan) => {
      const transactionFees = volume * (plan.transaction_fee_percentage / 100) + orders * plan.transaction_fee_fixed
      const totalCost = plan.monthly_fee + transactionFees
      return { plan, totalCost }
    })

    const cheapest = costs.reduce(
      (min, c) => (c.totalCost < min.totalCost ? c : min),
      costs[0] ?? { plan: null, totalCost: 0 },
    )

    return { costs, cheapestPlanId: cheapest.plan?.id }
  }, [monthlySales, orderCount, plans])

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-lg text-slate-900">Which plan is cheapest for you?</h3>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="space-y-2">
          <Label htmlFor="monthly-sales">Estimated monthly sales (₦)</Label>
          <Input
            id="monthly-sales"
            type="number"
            min="0"
            inputMode="numeric"
            value={monthlySales}
            onChange={(e) => setMonthlySales(e.target.value)}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-count">Estimated number of orders</Label>
          <Input
            id="order-count"
            type="number"
            min="0"
            inputMode="numeric"
            value={orderCount}
            onChange={(e) => setOrderCount(e.target.value)}
            className="bg-white"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {results.costs.map(({ plan, totalCost }) => {
          const isCheapest = plan.id === results.cheapestPlanId
          return (
            <div
              key={plan.id}
              className={`rounded-xl border-2 p-4 ${
                isCheapest ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-slate-900">{plan.name}</p>
                {isCheapest && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    Cheapest
                  </span>
                )}
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{formatNaira(totalCost)}</p>
              <p className="text-xs text-slate-500 mt-1">estimated per month</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
