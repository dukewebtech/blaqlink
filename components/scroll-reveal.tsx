"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true)
      return
    }

    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setInView(true)
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, inView }
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  onReveal,
}: {
  children: ReactNode
  className?: string
  delay?: number
  onReveal?: () => void
}) {
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView) onReveal?.()
  }, [inView])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease-out ${delay}ms, transform 0.5s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
