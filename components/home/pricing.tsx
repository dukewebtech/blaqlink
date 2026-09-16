"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useStoreLink } from "./store-link-context"
import styles from "./home.module.css"

const PLAN_FEATURES = [
  "Your own store link",
  "Tickets with QR check-in",
  "Bookings with a calendar",
  "Products with inventory tracking",
  "Digital products with automatic delivery",
  "Dashboard, customers and sales reports",
  "Secure Paystack checkout",
]

const PRICES = [500, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 50000, 75000, 100000, 150000, 250000, 500000]
const PLAN_COST = 4999
const fmt = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 })
function naira(n: number) {
  return (n < 0 ? "−₦" : "₦") + fmt.format(Math.abs(n))
}

export function Pricing() {
  const { signupHref } = useStoreLink()
  const [priceIndex, setPriceIndex] = useState(8)
  const [count, setCount] = useState(40)

  const price = PRICES[priceIndex]
  const flat = price >= 2500 ? 100 : 0
  const unit = Math.round((price * 0.035 + flat) * 100) / 100
  const gross = price * count
  const fees = unit * count
  const keep = gross - fees - PLAN_COST

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
  }, [keep])

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
          <h2>One plan. Everything included.</h2>
          <p>No tiers to compare and no features locked away. Check what you'll keep before you sell a thing.</p>
        </div>

        <div className={styles.priceGrid}>
          <article className={styles.plan}>
            <div className={styles.planHead}>
              <span className={styles.planName}>Blaqora</span>
              <span className={styles.planTag}>All four ways to sell</span>
            </div>
            <p className={styles.planPrice}>
              <span className={styles.planCur}>₦</span>
              <span className={styles.planNum}>4,999</span>
              <span className={styles.planPer}>/month</span>
            </p>
            <div className={styles.planFee}>
              <b>+ 3.5% + ₦100 per sale</b>
              <span>The ₦100 is waived on sales under ₦2,500</span>
            </div>
            <ul className={styles.planList}>
              {PLAN_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Link className="bq-btn bq-btn--primary bq-btn--lg bq-btn--block" href={signupHref()}>
              Create account
            </Link>
          </article>

          <article className={styles.calc}>
            <div className={styles.calcHead}>
              <h3>What you keep each month</h3>
              <p>Move the sliders to match your business.</p>
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
                  Fee per sale <span className={styles.hint}>{flat ? "(3.5% + ₦100)" : "(3.5%, ₦100 waived)"}</span>
                </dt>
                <dd>{naira(unit)}</dd>
              </div>
              <div>
                <dt>Transaction fees</dt>
                <dd>{naira(-fees)}</dd>
              </div>
              <div>
                <dt>Monthly plan</dt>
                <dd>{naira(-PLAN_COST)}</dd>
              </div>
            </dl>

            <div className={styles.calcKeep}>
              <span>You keep</span>
              <b ref={keepRef} className={keep < 0 ? styles.isNeg : ""} />
            </div>
            <p className={styles.calcNote}>{note}</p>
          </article>
        </div>
      </div>
    </section>
  )
}
