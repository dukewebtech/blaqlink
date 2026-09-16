"use client"

import { useEffect, useRef, useState, type ReactElement } from "react"
import Link from "next/link"
import { Ticket, Calendar, ShoppingBag, Download, ScanLine, CheckCircle2 } from "lucide-react"
import { useStoreLink } from "./store-link-context"
import styles from "./home.module.css"

export type UseCaseTab = "tickets" | "bookings" | "products" | "digital"

const TABS: { id: UseCaseTab; icon: typeof Ticket; iconClass: string; label: string }[] = [
  { id: "tickets", icon: Ticket, iconClass: "bq-icon--tix", label: "Tickets" },
  { id: "bookings", icon: Calendar, iconClass: "bq-icon--book", label: "Bookings" },
  { id: "products", icon: ShoppingBag, iconClass: "bq-icon--prod", label: "Products" },
  { id: "digital", icon: Download, iconClass: "bq-icon--dig", label: "Digital" },
]

const PANEL_COPY: Record<UseCaseTab, { who: string; heading: string; ticks: string[]; tag: string; cta: string }> = {
  tickets: {
    who: "For event hosts, promoters, churches, schools and communities",
    heading: "Sell out your event. Breeze through the door.",
    ticks: [
      "Create regular, VIP and early-bird tickets in minutes",
      "Every buyer gets their own QR ticket",
      "Scan guests in at the gate with your phone",
    ],
    tag: "QR check-in included",
    cta: "Start selling tickets",
  },
  bookings: {
    who: "For stylists, makeup artists, photographers, coaches and consultants",
    heading: "Fill your calendar without the back-and-forth.",
    ticks: [
      "Set the days and hours you're available",
      "Clients pick a free slot and pay to confirm",
      "No double bookings, no chasing deposits in DMs",
    ],
    tag: "Booking calendar included",
    cta: "Start taking bookings",
  },
  products: {
    who: "For fashion brands, beauty sellers, food vendors and shops",
    heading: "A proper shop for what you make and stock.",
    ticks: [
      "Add photos, sizes, colours and prices",
      "Stock updates by itself after every order",
      "Customers check out without sending you a DM",
    ],
    tag: "Inventory tracking included",
    cta: "Start selling products",
  },
  digital: {
    who: "For writers, designers, educators and creators",
    heading: "Sell once, deliver forever, automatically.",
    ticks: [
      "Upload e-books, templates, presets or course files",
      "Buyers get their download the moment they pay",
      "Sell the same file to one person or thousands",
    ],
    tag: "Automatic file delivery included",
    cta: "Start selling digital",
  },
}

function TicketsVisual() {
  return (
    <div className={styles.vTix}>
      <div className={styles.poster}>
        <span className={styles.posterDate}>FRI 24 OCT, 7PM</span>
        <span className={styles.posterTitle}>
          Lagos
          <br />
          Live
        </span>
        <span className={styles.posterVenue}>Victoria Island, Lagos</span>
        <span className={styles.posterRays} />
      </div>
      <div className={styles.qrTicket}>
        <div className={styles.qrTicketTop}>
          <span className={styles.qrTicketType}>VIP</span>
          <span className={styles.qrTicketPrice}>₦25,000</span>
        </div>
        <svg className={styles.qr} viewBox="0 0 100 100" aria-hidden="true">
          <rect width="100" height="100" fill="#fff" />
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) =>
              (r + c) % 3 === 0 ? <rect key={`${r}-${c}`} x={c * 12 + 4} y={r * 12 + 4} width="8" height="8" fill="#0A0E27" /> : null,
            ),
          )}
        </svg>
        <p className={styles.qrTicketName}>Admit one</p>
      </div>
      <div className={styles.scan}>
        <span className={styles.scanOk}>
          <ScanLine aria-hidden="true" />
        </span>
        <span>
          <b>Checked in</b>
          <small>VIP, Gate A</small>
        </span>
      </div>
    </div>
  )
}

function BookingsVisual() {
  return (
    <div className={styles.vBook}>
      <div className={styles.cal}>
        <div className={styles.calHead}>
          <b>October</b>
          <span>Braids session, 3 hrs</span>
        </div>
        <div className={styles.calDays}>
          <span>
            <b>20</b>Mon
          </span>
          <span>
            <b>21</b>Tue
          </span>
          <span className={styles.on}>
            <b>22</b>Wed
          </span>
          <span>
            <b>23</b>Thu
          </span>
          <span className={styles.off}>
            <b>24</b>Fri
          </span>
        </div>
        <div className={styles.calSlots}>
          <span className={styles.taken}>8:00 AM</span>
          <span className={styles.pick}>10:00 AM</span>
          <span>1:00 PM</span>
          <span className={styles.taken}>3:00 PM</span>
          <span>5:00 PM</span>
          <span>6:30 PM</span>
        </div>
        <span className={styles.calCta}>Pay ₦15,000 and confirm</span>
      </div>
      <div className={styles.confirm}>
        <span className={styles.confirmIco}>
          <CheckCircle2 aria-hidden="true" />
        </span>
        <span>
          <b>Booking confirmed</b>
          <small>Wed 22 Oct, 10:00 AM</small>
        </span>
      </div>
    </div>
  )
}

function ProductsVisual({ active }: { active: boolean }) {
  const [stock, setStock] = useState(12)

  useEffect(() => {
    if (!active) {
      setStock(12)
      return
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    const id = setInterval(() => setStock((n) => (n <= 3 ? 12 : n - 1)), 1400)
    return () => clearInterval(id)
  }, [active])

  return (
    <div className={styles.vProd}>
      <div className={styles.pcard}>
        <div className={styles.pcardImg}>
          <span className={`${styles.tote} ${styles.toteXl}`}>
            <span className={styles.toteHandle} />
            <span className={styles.toteBody} />
          </span>
        </div>
        <div className={styles.pcardBody}>
          <div className={styles.pcardRow}>
            <span>Ankara tote bag</span>
            <b>₦18,500</b>
          </div>
          <div className={styles.swatches}>
            <i className={styles.s1} />
            <i className={`${styles.s2} ${styles.on}`} />
            <i className={styles.s3} />
          </div>
          <span className={styles.pcardBtn}>Add to cart</span>
        </div>
      </div>
      <div className={styles.stock}>
        <p className={styles.stockLabel}>Stock left</p>
        <p className={styles.stockNum}>
          {stock}
          <small>units</small>
        </p>
        <span className={styles.stockBar}>
          <i style={{ width: `${(stock / 20) * 100}%` }} />
        </span>
      </div>
    </div>
  )
}

function DigitalVisual() {
  return (
    <div className={styles.vDig}>
      <div className={`${styles.ebook} ${styles.ebookXl}`}>
        <span className={styles.ebookT}>
          The
          <br />
          Money
          <br />
          Plan
        </span>
        <span className={styles.ebookA}>A practical budget guide</span>
      </div>
      <div className={styles.deliver}>
        <div className={styles.deliverRow}>
          <span className={styles.deliverFile}>PDF</span>
          <span>
            <b>money-plan.pdf</b>
            <small>4.2 MB</small>
          </span>
        </div>
        <span className={styles.deliverBar}>
          <i />
        </span>
        <div className={styles.deliverDone}>
          <CheckCircle2 aria-hidden="true" />
          Sent to buyer&apos;s email
        </div>
      </div>
    </div>
  )
}

const VISUALS: Record<UseCaseTab, (active: boolean) => ReactElement> = {
  tickets: () => <TicketsVisual />,
  bookings: () => <BookingsVisual />,
  products: (active) => <ProductsVisual active={active} />,
  digital: () => <DigitalVisual />,
}

const PANEL_CLASS: Record<UseCaseTab, string> = {
  tickets: styles.panelTix,
  bookings: styles.panelBook,
  products: styles.panelProd,
  digital: styles.panelDig,
}

const TAG_CLASS: Record<UseCaseTab, string> = {
  tickets: "bq-tag--tix",
  bookings: "bq-tag--book",
  products: "bq-tag--prod",
  digital: "bq-tag--dig",
}

export function UseCaseTabs({ active, onChange }: { active: UseCaseTab; onChange: (tab: UseCaseTab) => void }) {
  const { signupHref } = useStoreLink()
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const gliderRef = useRef<HTMLSpanElement>(null)
  const activeIndex = TABS.findIndex((t) => t.id === active)

  function moveGlider() {
    const el = tabRefs.current[active]
    const glider = gliderRef.current
    if (!el || !glider) return
    glider.style.width = `${el.offsetWidth}px`
    glider.style.transform = `translateX(${el.offsetLeft}px)`
  }

  useEffect(() => {
    moveGlider()
    tabRefs.current[active]?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    })
  }, [active])

  useEffect(() => {
    window.addEventListener("resize", moveGlider)
    document.fonts?.ready.then(moveGlider)
    return () => window.removeEventListener("resize", moveGlider)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    const dir = e.key === "ArrowRight" ? 1 : -1
    const next = TABS[(activeIndex + dir + TABS.length) % TABS.length]
    onChange(next.id)
    tabRefs.current[next.id]?.focus()
  }

  const copy = PANEL_COPY[active]

  return (
    <section className={styles.sec} id="sell">
      <div className="bq-container">
        <div className={`${styles.head} ${styles.headCenter}`}>
          <h2>Whatever you sell, it has a home here.</h2>
          <p>Pick the way you earn. Your customers see everything on one store link, and each type comes with the tool it needs.</p>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Ways to sell" onKeyDown={handleKeyDown}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={active === tab.id}
              tabIndex={active === tab.id ? 0 : -1}
              className={styles.tab}
              onClick={() => onChange(tab.id)}
            >
              <span className={`bq-icon ${tab.iconClass}`}>
                <tab.icon aria-hidden="true" />
              </span>
              {tab.label}
            </button>
          ))}
          <span className={styles.tabsGlider} ref={gliderRef} aria-hidden="true" />
        </div>

        {TABS.map((tab) => {
          const isActive = tab.id === active
          const tabCopy = PANEL_COPY[tab.id]
          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              hidden={!isActive}
              className={`${styles.panel} ${PANEL_CLASS[tab.id]}`}
            >
              {isActive && (
                <>
                  <div className={styles.panelCopy}>
                    <p className={styles.panelWho}>{tabCopy.who}</p>
                    <h3>{tabCopy.heading}</h3>
                    <ul className={styles.ticks}>
                      {tabCopy.ticks.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                    <span className={`bq-tag ${TAG_CLASS[tab.id]}`}>{tabCopy.tag}</span>
                    <Link className="bq-btn bq-btn--dark" href={signupHref()}>
                      {tabCopy.cta}
                    </Link>
                  </div>
                  <div className={styles.panelVisual} aria-hidden="true">
                    {VISUALS[tab.id](isActive)}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
