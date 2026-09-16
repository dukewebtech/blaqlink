"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { PricingCalculator } from "@/components/pricing-calculator"
import type { PricingPlan } from "@/lib/pricing"

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTransactionFee(plan: PricingPlan) {
  const pct = `${plan.transaction_fee_percentage}%`
  if (plan.transaction_fee_fixed > 0) {
    return `${pct} + ${formatNaira(plan.transaction_fee_fixed)} per sale`
  }
  return `${pct} per sale`
}

export function PricingSection() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/pricing-plans")
        const result = await res.json()
        if (res.ok && result.plans) {
          setPlans(result.plans)
        }
      } catch (error) {
        console.error("[v0] Failed to load pricing plans:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  return (
    <section id="pricing" className="py-24 px-5 sm:px-6 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">Start free, upgrade when you need more power.</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border-2 border-slate-100 p-8 h-96 animate-pulse bg-slate-50" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={
                    plan.is_popular
                      ? "rounded-2xl border-2 border-blue-600 p-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white h-full flex flex-col relative overflow-hidden shadow-xl shadow-blue-200"
                      : "rounded-2xl border-2 border-slate-200 p-8 h-full flex flex-col hover:border-blue-200 transition-colors"
                  }
                >
                  {plan.is_popular && (
                    <div className="absolute top-5 right-5">
                      <span className="bg-yellow-400 text-blue-950 text-xs font-bold px-3 py-1 rounded-full">
                        Most popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <p className={`font-bold text-xl mb-1 ${plan.is_popular ? "text-white" : "text-slate-900"}`}>
                      {plan.name}
                    </p>
                    <p className={`text-sm ${plan.is_popular ? "text-blue-200" : "text-slate-500"}`}>
                      {plan.description}
                    </p>
                    <p className={`mt-4 text-4xl font-extrabold ${plan.is_popular ? "text-white" : "text-slate-900"}`}>
                      {formatNaira(plan.monthly_fee)}
                      <span className={`text-base font-normal ${plan.is_popular ? "text-blue-300" : "text-slate-400"}`}>
                        {" "}
                        / month
                      </span>
                    </p>
                    <p className={`mt-1 text-sm ${plan.is_popular ? "text-blue-200" : "text-slate-500"}`}>
                      {formatTransactionFee(plan)}
                    </p>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className={`flex items-center gap-3 text-sm ${plan.is_popular ? "" : "text-slate-600"}`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${plan.is_popular ? "text-yellow-300" : "text-green-500"}`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <Button
                      className={
                        plan.is_popular
                          ? "w-full rounded-full bg-yellow-400 text-blue-950 hover:bg-yellow-300 font-bold shadow-lg shadow-yellow-400/25 transition-all hover:scale-105"
                          : "w-full rounded-full border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 font-semibold"
                      }
                      variant={plan.is_popular ? undefined : "outline"}
                    >
                      {plan.monthly_fee === 0 ? "Get started free" : `Start ${plan.name}`}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            {plans.length > 0 && (
              <div className="max-w-3xl mx-auto">
                <PricingCalculator plans={plans} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
