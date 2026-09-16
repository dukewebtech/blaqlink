"use client"

import { useEffect, useState } from "react"
import styles from "./home.module.css"

const ITEMS: { label: string; cat: "tix" | "book" | "prod" | "dig" }[] = [
  { label: "Concert tickets", cat: "tix" },
  { label: "Hair appointments", cat: "book" },
  { label: "Fashion and fabrics", cat: "prod" },
  { label: "E-books and guides", cat: "dig" },
  { label: "Workshops", cat: "tix" },
  { label: "Photo sessions", cat: "book" },
  { label: "Skincare", cat: "prod" },
  { label: "Templates", cat: "dig" },
  { label: "Church and campus events", cat: "tix" },
  { label: "Consultations", cat: "book" },
  { label: "Food trays", cat: "prod" },
  { label: "Online courses", cat: "dig" },
  { label: "Makeup bookings", cat: "book" },
  { label: "Gadgets", cat: "prod" },
  { label: "Lightroom presets", cat: "dig" },
  { label: "Masterclasses", cat: "tix" },
]

function Chip({ label, cat, hidden }: { label: string; cat: string; hidden?: boolean }) {
  return (
    <span className={`bq-chip bq-chip--${cat}`} aria-hidden={hidden || undefined}>
      {label}
    </span>
  )
}

export function Marquee() {
  const [duplicate, setDuplicate] = useState(false)

  useEffect(() => {
    setDuplicate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  return (
    <section className={styles.strip} aria-label="Examples of what vendors can sell">
      <div className="bq-container">
        <p className={styles.stripLabel}>Built for vendors who sell</p>
        <div className={styles.marquee}>
          <div className={styles.marqueeTrack}>
            {ITEMS.map((item, i) => (
              <Chip key={`a-${i}`} label={item.label} cat={item.cat} />
            ))}
            {duplicate && ITEMS.map((item, i) => <Chip key={`b-${i}`} label={item.label} cat={item.cat} hidden />)}
          </div>
        </div>
      </div>
    </section>
  )
}
