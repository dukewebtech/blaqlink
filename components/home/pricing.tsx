"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useStoreLink } from "./store-link-context"
import styles from "./home.module.css"

interface Plan {
  plan_key: string
  name: string
  description: string | null
  monthly_fee: number
  transaction_fee_percentage: number
  transaction_fee_fixed: number
  product_limit: number | null
  allowed_selling_types: string[]
  is_popular: boolean
}

const SELLING_TYPES = ["event", "appointment", "physical", "digital"]
const SELLING_TYPE_LABELS: Record<string, string> = {
  event: "Event tickets with QR check-in",
  appointment: "Bookings with a calendar",
  physical: "Physical products with inventory tracking",
  digital: "Digital products with automatic delivery",
}
const SHARED_FEATURES = ["Your own store link", "Dashboard, customers and sales reports", "Secure Paystack checkout"]

// Built from what the plan actually enforces (see /api/products), not its
// marketing copy, so a card can't promise something the account can't do.
function planFeatures(plan: Plan) {
  return [
    plan.product_limit === null ? "Unlimited products" : `Up to ${plan.product_limit} products`,
    ...SELLING_TYPES.filter((t) => plan.allowed_selling_types.includes(t)).map((t) => SELLING_TYPE_LABELS[t]),
    ...SHARED_FEATURES,
  ]
}

function feeLabel(plan: Plan) {
  const pct = `${Number(plan.transaction_fee_percentage)}%`
  return Number(plan.transaction_fee_fixed) > 0 ? `${pct} + ${naira(Number(plan.transaction_fee_fixed))}` : pct
}

const PRICES = [500, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 50000, 75000, 100000, 150000, 250000, 500000]
const fmt = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 })
function naira(n: number) {
  return (n < 0 ? "−₦" : "₦") + fmt.format(Math.abs(n))
}

export function Pricing() {
  const { signupHref } = useStoreLink()
  const [priceIndex, setPriceIndex] = useState(8)
  const [count, setCount] = useState(40)
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const loadPlans = useCallback(() => {
    setLoadFailed(false)
    fetch("/api/pricing-plans")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load plans"))))
      .then((data) => {
        if (!data.plans?.length) throw new Error("No plans")
        setPlans(data.plans)
      })
      .catch(() => setLoadFailed(true))
  }, [])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const plan = plans?.find((p) => p.plan_key === selectedKey) ?? plans?.[0] ?? null
  const startingPlan = plans?.find((p) => p.plan_key === "free") ?? plans?.[0] ?? null
  const planCost = Number(plan?.monthly_fee ?? 0)

  const price = PRICES[priceIndex]
  // Same sum as computeOrderFee in lib/pricing.ts, which charges the real fee
  const unit = plan
    ? Math.round((price * (Number(plan.transaction_fee_percentage) / 100) + Number(plan.transaction_fee_fixed)) * 100) / 100
    : 0
  const gross = price * count
  const fees = unit * count
  const keep = gross - fees - planCost

  const keepRef = useRef<HTMLElement>(null)
  const shownKeepRef = useRef<number | null>(null)
  const keepAnimRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const el = keepRef.current
    if (!el) return

    if (reduce || shownKeepRef.current === null) {
      shownKeepRef.current = keep
      el.textContent = naira(Math.round(keep))
      return
    }

    cancelAnimationFrame(keepAnimRef.current!)
    const from = shownKeepRef.current
    const to = keep
    const t0 = performance.now()
    function step(t: number) {
      const p = Math.min((t - t0) / 380, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      shownKeepRef.current = from + (to - from) * eased
      if (el) el.textContent = naira(Math.round(shownKeepRef.current))
      if (p < 1) keepAnimRef.current = requestAnimationFrame(step)
    }
    keepAnimRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(keepAnimRef.current!)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keep, plan?.plan_key])

  const priceFillPct = (priceIndex / (PRICES.length - 1)) * 100
  const countFillPct = ((count - 1) / (300 - 1)) * 100
  const note =
    keep < 0
      ? "At this volume your monthly plan costs more than your sales. A few more sales covers it."
      : `That's ${Math.floor((keep / gross) * 100)}% of your sales, after every Blaqora charge.`

  return (
    <section className={`${styles.sec} ${styles.pricing}`} id="pricing">
      <div className="bq-container">
        <div className={`${styles.head} ${styles.headCenter}`}>
          <h2>Pick the plan that fits how you sell.</h2>
          <p>Every fee is on the table. Check what you'll keep before you sell a thing.</p>
        </div>

        {loadFailed && (
          <div className={`bq-empty ${styles.planError}`}>
            <h3 className="bq-empty__title">Pricing didn't load</h3>
            <p className="bq-empty__text">Check your connection and try again.</p>
            <button type="button" className="bq-btn bq-btn--primary" onClick={loadPlans}>
              Try again
            </button>
          </div>
        )}

        {!plans && !loadFailed && <div className={styles.planLoading} aria-busy="true" aria-label="Loading plans" />}

        {plans && plan && (
          <>
            <div className={styles.planGrid}>
              {plans.map((p) => (
                <article key={p.plan_key} className={`${styles.plan} ${p.is_popular ? styles.planFeatured : ""}`}>
                  <div className={styles.planHead}>
                    <span className={styles.planName}>{p.name}</span>
                    {p.is_popular && <span className={styles.planTag}>Recommended</span>}
                  </div>
                  {p.description && <p className={styles.planDesc}>{p.description}</p>}
                  <p className={styles.planPrice}>
                    <span className={styles.planCur}>₦</span>
                    <span className={styles.planNum}>{fmt.format(Number(p.monthly_fee))}</span>
                    <span className={styles.planPer}>/month</span>
                  </p>
                  <div className={styles.planFee}>
                    <b>+ {feeLabel(p)} per sale</b>
                  </div>
                  <ul className={styles.planList}>
                    {planFeatures(p).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Link
                    className={`bq-btn bq-btn--block bq-btn--lg ${p.is_popular ? "bq-btn--primary" : "bq-btn--secondary"}`}
                    href={signupHref()}
                  >
                    Create account
                  </Link>
                </article>
              ))}
            </div>

            {startingPlan && (
              <p className={styles.planStart}>
                Every new store starts on {startingPlan.name}. Move to another plan from your dashboard whenever you're ready.
              </p>
            )}

            <div className={styles.calcWrap}>
              <article className={styles.calc}>
                <div className={styles.calcHead}>
                  <h3>What you keep each month</h3>
                  <p>Pick a plan and move the sliders to match your business.</p>
                </div>

                <div className={`bq-tabs ${styles.calcPlans}`} role="tablist" aria-label="Plan">
                  {plans.map((p) => (
                    <button
                      key={p.plan_key}
                      type="button"
                      role="tab"
                      className="bq-tab"
                      aria-selected={p.plan_key === plan.plan_key}
                      onClick={() => setSelectedKey(p.plan_key)}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                <div className={styles.range}>
                  <div className={styles.rangeTop}>
                    <label htmlFor="r-price">Average sale</label>
                    <output htmlFor="r-price">{naira(price)}</output>
                  </div>
                  <input
                    id="r-price"
                    className={styles.rangeInput}
                    type="range"
                    min={0}
                    max={PRICES.length - 1}
                    step={1}
                    value={priceIndex}
                    style={{ ["--p" as any]: `${priceFillPct}%` }}
                    aria-valuetext={naira(price)}
                    onChange={(e) => setPriceIndex(Number(e.target.value))}
                  />
                </div>

                <div className={styles.range}>
                  <div className={styles.rangeTop}>
                    <label htmlFor="r-count">Sales per month</label>
                    <output htmlFor="r-count">{count}</output>
                  </div>
                  <input
                    id="r-count"
                    className={styles.rangeInput}
                    type="range"
                    min={1}
                    max={300}
                    step={1}
                    value={count}
                    style={{ ["--p" as any]: `${countFillPct}%` }}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </div>

                <dl className={styles.calcRows}>
                  <div>
                    <dt>Total sales</dt>
                    <dd>{naira(gross)}</dd>
                  </div>
                  <div>
                    <dt>
                      Fee per sale <span className={styles.hint}>({feeLabel(plan)})</span>
                    </dt>
                    <dd>{naira(unit)}</dd>
                  </div>
                  <div>
                    <dt>Transaction fees</dt>
                    <dd>{naira(-fees)}</dd>
                  </div>
                  <div>
                    <dt>Monthly plan</dt>
                    <dd>{planCost > 0 ? naira(-planCost) : naira(0)}</dd>
                  </div>
                </dl>

                <div className={styles.calcKeep}>
                  <span>You keep</span>
                  <b ref={keepRef} className={keep < 0 ? styles.isNeg : ""} />
                </div>
                <p className={styles.calcNote}>{note}</p>
              </article>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
