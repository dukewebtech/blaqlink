"use client"

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react"
import { useStoreLink } from "./store-link-context"
import styles from "./home.module.css"

function useReveal() {
  const ref = useRef<HTMLElement>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || !("IntersectionObserver" in window)) {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.unobserve(el)
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return { ref, seen }
}

function useSpotlight() {
  function onPointerMove(e: ReactMouseEvent<HTMLElement>) {
    const card = e.currentTarget
    const r = card.getBoundingClientRect()
    card.style.setProperty("--mx", `${e.clientX - r.left}px`)
    card.style.setProperty("--my", `${e.clientY - r.top}px`)
  }
  return onPointerMove
}

const SWATCHES = [
  { name: "Blue", hex: "#155DFD" },
  { name: "Coral", hex: "#F2542D" },
  { name: "Violet", hex: "#7A5CFF" },
  { name: "Green", hex: "#0E9F6E" },
  { name: "Black", hex: "#0A0E27" },
]

function OverviewCard() {
  const { ref, seen } = useReveal()
  const onPointerMove = useSpotlight()

  return (
    <article
      ref={ref as any}
      className={`${styles.b} ${styles.bOverview} ${seen ? styles.isSeen : ""}`}
      onMouseMove={onPointerMove}
    >
      <div className={styles.bCopy}>
        <h3>See how you're doing at a glance</h3>
        <p>Revenue, orders and customers update as you sell.</p>
      </div>
      <div className={styles.miniDash}>
        <aside className={styles.miniDashSide}>
          <span className={styles.on}>
            <i />
            Dashboard
          </span>
          <span>
            <i />
            Products
          </span>
          <span>
            <i />
            Transactions
          </span>
          <span>
            <i />
            Payouts
          </span>
          <span>
            <i />
            Customers
          </span>
          <span>
            <i />
            Sales report
          </span>
        </aside>
        <div className={styles.miniDashMain}>
          <div className={styles.miniDashStats}>
            <div className={`${styles.kpi} ${styles.kpiBlue}`}>
              <small>Revenue this week</small>
              <b>₦248,500</b>
            </div>
            <div className={styles.kpi}>
              <small>Orders</small>
              <b>31</b>
            </div>
          </div>
          <div className={`${styles.chartBox} ${seen ? styles.isSeen : ""}`}>
            <span className={styles.chartTip}>
              Sat
              <b>₦62,400</b>
            </span>
            <svg className={styles.chart} viewBox="0 0 260 110" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="bentoAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#155DFD" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#155DFD" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className={styles.chartArea} d="M0,80 L40,70 L80,60 L120,65 L160,40 L200,45 L260,20 L260,110 L0,110 Z" fill="url(#bentoAreaFill)" />
              <path className={styles.chartLine} d="M0,80 L40,70 L80,60 L120,65 L160,40 L200,45 L260,20" fill="none" stroke="#155DFD" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.chartDays}>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
          <ul className={styles.orders}>
            <li>
              <span className={styles.ordersDot} style={{ background: "var(--bq-tix-50)" }} />
              <span className={styles.ordersT}>Lagos Live, VIP ticket</span>
              <em>₦25,000</em>
            </li>
            <li>
              <span className={styles.ordersDot} style={{ background: "var(--bq-prod-50)" }} />
              <span className={styles.ordersT}>Ankara tote bag</span>
              <em>₦18,500</em>
            </li>
            <li>
              <span className={styles.ordersDot} style={{ background: "var(--bq-book-50)" }} />
              <span className={styles.ordersT}>Braids session</span>
              <em>₦15,000</em>
            </li>
          </ul>
        </div>
      </div>
    </article>
  )
}

function PayoutCard() {
  const { ref, seen } = useReveal()
  const onPointerMove = useSpotlight()
  return (
    <article
      ref={ref as any}
      className={`${styles.b} ${styles.bPayout} ${styles.reveal} ${seen ? styles.isSeen : ""}`}
      onMouseMove={onPointerMove}
    >
      <div className={styles.bCopy}>
        <h3>Withdraw to your bank</h3>
        <p>Your earnings land in your Blaqora balance, ready to move to your bank account.</p>
      </div>
      <div className={styles.wallet}>
        <small>Available balance</small>
        <b>₦186,240.00</b>
        <span className={styles.walletBtn}>Withdraw</span>
      </div>
    </article>
  )
}

function BrandCard() {
  const { ref, seen } = useReveal()
  const onPointerMove = useSpotlight()
  const [color, setColor] = useState(SWATCHES[0].hex)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(e: React.KeyboardEvent, i: number) {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return
    e.preventDefault()
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1
    const next = (i + dir + SWATCHES.length) % SWATCHES.length
    setColor(SWATCHES[next].hex)
    btnRefs.current[next]?.focus()
  }

  return (
    <article
      ref={ref as any}
      className={`${styles.b} ${styles.bBrand} ${styles.reveal} ${seen ? styles.isSeen : ""}`}
      onMouseMove={onPointerMove}
    >
      <div className={styles.bCopy}>
        <h3>Make it look like you</h3>
        <p>Pick your colour and your store follows. Try it.</p>
      </div>
      <div className={styles.brandkit}>
        <div className={styles.brandkitSwatches} role="radiogroup" aria-label="Store colour preview">
          {SWATCHES.map((s, i) => (
            <button
              key={s.hex}
              type="button"
              role="radio"
              aria-checked={color === s.hex}
              aria-label={s.name}
              style={{ ["--c" as any]: s.hex }}
              ref={(el) => {
                btnRefs.current[i] = el
              }}
              onClick={() => setColor(s.hex)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            />
          ))}
        </div>
        <div className={styles.brandkitPreview} style={{ ["--accent" as any]: color }} aria-hidden="true">
          <span className={styles.bpBanner} />
          <span className={styles.bpAvatar}>A</span>
          <span className={styles.bpLine} />
          <span className={`${styles.bpLine} ${styles.bpLineS}`} />
          <span className={styles.bpBtn}>Buy now</span>
        </div>
      </div>
    </article>
  )
}

function ShareCard() {
  const { ref, seen } = useReveal()
  const onPointerMove = useSpotlight()
  const { displayName } = useStoreLink()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const link = `https://blaqora.store/${displayName}`
    const done = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(done, done)
    } else {
      done()
    }
  }

  return (
    <article
      ref={ref as any}
      className={`${styles.b} ${styles.bShare} ${styles.reveal} ${seen ? styles.isSeen : ""}`}
      onMouseMove={onPointerMove}
    >
      <div className={styles.bCopy}>
        <h3>Share it everywhere</h3>
        <p>One link for your bio, status, broadcasts and flyers.</p>
      </div>
      <div className={styles.share}>
        <div className={styles.shareLink}>
          <span>
            blaqora.store/<b>{displayName}</b>
          </span>
          <button type="button" className={`${styles.shareCopy} ${copied ? styles.isDone : ""}`} onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className={styles.shareApps} aria-hidden="true">
          <span className={`${styles.appIco} ${styles.appIcoWa}`} />
          <span className={`${styles.appIco} ${styles.appIcoIg}`} />
          <span className={`${styles.appIco} ${styles.appIcoTt}`} />
          <span className={`${styles.appIco} ${styles.appIcoX}`} />
        </div>
      </div>
    </article>
  )
}

function CustomersCard() {
  const { ref, seen } = useReveal()
  const onPointerMove = useSpotlight()
  return (
    <article
      ref={ref as any}
      className={`${styles.b} ${styles.bCustomers} ${styles.reveal} ${seen ? styles.isSeen : ""}`}
      onMouseMove={onPointerMove}
    >
      <div className={styles.bCopy}>
        <h3>Know your customers</h3>
        <p>Every buyer and what they bought, saved for you.</p>
      </div>
      <ul className={styles.people} aria-hidden="true">
        <li>
          <span className={`${styles.av} ${styles.av1}`}>TO</span>
          <span>
            <b>Tolu O.</b>
            <small>3 orders</small>
          </span>
          <em>₦42,000</em>
        </li>
        <li>
          <span className={`${styles.av} ${styles.av2}`}>CE</span>
          <span>
            <b>Chidi E.</b>
            <small>1 booking</small>
          </span>
          <em>₦15,000</em>
        </li>
        <li>
          <span className={`${styles.av} ${styles.av3}`}>AM</span>
          <span>
            <b>Amina M.</b>
            <small>2 tickets</small>
          </span>
          <em>₦10,000</em>
        </li>
      </ul>
    </article>
  )
}

export function BentoGrid() {
  return (
    <section className={styles.sec}>
      <div className="bq-container">
        <div className={styles.head}>
          <h2>Run your whole business from one calm dashboard.</h2>
          <p>Everything a vendor checks every day sits one tap away: sales, customers, transactions and payouts.</p>
        </div>
        <div className={styles.bento}>
          <OverviewCard />
          <PayoutCard />
          <BrandCard />
          <ShareCard />
          <CustomersCard />
        </div>
      </div>
    </section>
  )
}
