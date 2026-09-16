"use client"

import { useEffect, useRef, useState } from "react"
import { CreditCard, Landmark, ShieldCheck, ListChecks, Clock } from "lucide-react"
import styles from "./home.module.css"

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
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

const CARDS = [
  { icon: ShieldCheck, title: "Secure by default", desc: "Payments are processed by Paystack, so card details never touch your store." },
  { icon: ListChecks, title: "A record of every sale", desc: "Find any transaction, see who paid and what for, and check your sales report anytime." },
  { icon: Clock, title: "No surprise charges", desc: "One plan and one fee per sale. The calculator below shows exactly what you keep." },
]

function MoneyCard({ card }: { card: (typeof CARDS)[number] }) {
  const { ref, seen } = useReveal()
  return (
    <div ref={ref} className={`${styles.mcard} ${styles.reveal} ${seen ? styles.isSeen : ""}`}>
      <span className={styles.mcardIco}>
        <card.icon aria-hidden="true" />
      </span>
      <h3>{card.title}</h3>
      <p>{card.desc}</p>
    </div>
  )
}

export function MoneyFlow() {
  return (
    <section className={`${styles.sec} ${styles.money}`}>
      <div className={styles.moneyGlow} aria-hidden="true" />
      <div className="bq-container">
        <div className={`${styles.head} ${styles.headCenter} ${styles.headLight}`}>
          <h2>Every naira, accounted for.</h2>
          <p>Customers pay through a secure Paystack checkout. You see every transaction, and you decide when to withdraw.</p>
        </div>

        <div className={styles.flow} aria-label="How money moves on Blaqora">
          <div className={styles.flowNode}>
            <span className={styles.flowIco}>
              <CreditCard aria-hidden="true" />
            </span>
            <b>Customer pays</b>
            <small>Secure checkout on your store</small>
          </div>
          <div className={styles.flowLine} aria-hidden="true">
            <i />
          </div>
          <div className={`${styles.flowNode} ${styles.flowNodeMain}`}>
            <span className={`${styles.flowIco} ${styles.flowIcoLogo}`}>
              <img src="/blaqora-icon.png" alt="" width={40} height={40} />
            </span>
            <b>Your Blaqora balance</b>
            <small>Tracked in Transactions</small>
          </div>
          <div className={styles.flowLine} aria-hidden="true">
            <i />
          </div>
          <div className={styles.flowNode}>
            <span className={styles.flowIco}>
              <Landmark aria-hidden="true" />
            </span>
            <b>Your bank account</b>
            <small>Withdraw from Payouts</small>
          </div>
        </div>

        <div className={styles.moneyCards}>
          {CARDS.map((card) => (
            <MoneyCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
