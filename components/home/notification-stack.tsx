"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, ScanLine, Calendar, Mail } from "lucide-react"
import styles from "./home.module.css"

const NOTES = [
  { icon: CheckCircle2, iconClass: "bq-icon--prod", title: "Payment received", detail: "Ankara tote, ₦18,500" },
  { icon: ScanLine, iconClass: "bq-icon--tix", title: "Guest checked in", detail: "Lagos Live, ticket scanned" },
  { icon: Calendar, iconClass: "bq-icon--book", title: "New booking", detail: "Braids session, Sat 10:00 AM" },
  { icon: Mail, iconClass: "bq-icon--dig", title: "File delivered", detail: "Budget planner sent to buyer" },
]

export function NotificationStack() {
  const [inIndex, setInIndex] = useState<number | null>(null)
  const [outIndex, setOutIndex] = useState<number | null>(null)
  const niRef = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setInIndex(0)
      return
    }

    let timers: ReturnType<typeof setTimeout>[] = []

    function cycle() {
      const prev = (niRef.current - 1 + NOTES.length) % NOTES.length
      setOutIndex(prev)
      timers.push(setTimeout(() => setOutIndex(null), 500))
      setInIndex(niRef.current)
      niRef.current = (niRef.current + 1) % NOTES.length
      timers.push(setTimeout(cycle, 2800))
    }

    timers.push(setTimeout(cycle, 1300))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className={styles.notes} aria-hidden="true">
      {NOTES.map((note, i) => (
        <div key={note.title} className={`${styles.note} ${i === inIndex ? styles.isIn : ""} ${i === outIndex ? styles.isOut : ""}`}>
          <span className={`bq-icon ${note.iconClass} ${styles.noteIco}`}>
            <note.icon aria-hidden="true" />
          </span>
          <span className={styles.noteTxt}>
            <b>{note.title}</b>
            <small>{note.detail}</small>
          </span>
          <span className={styles.noteTime}>now</span>
        </div>
      ))}
    </div>
  )
}
