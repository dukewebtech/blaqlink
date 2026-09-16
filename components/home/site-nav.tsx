"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Menu, X, Ticket, Calendar, ShoppingBag, Download } from "lucide-react"
import { useStoreLink } from "./store-link-context"
import styles from "./home.module.css"

const SELL_ITEMS = [
  { tab: "tickets", icon: Ticket, iconClass: "bq-icon--tix", title: "Event tickets", short: "Tickets", desc: "Sell entry and check guests in with QR codes" },
  { tab: "bookings", icon: Calendar, iconClass: "bq-icon--book", title: "Bookings", short: "Bookings", desc: "Let clients pick a time and pay upfront" },
  { tab: "products", icon: ShoppingBag, iconClass: "bq-icon--prod", title: "Physical products", short: "Products", desc: "List items and track stock automatically" },
  { tab: "digital", icon: Download, iconClass: "bq-icon--dig", title: "Digital products", short: "Digital", desc: "Deliver files the moment buyers pay" },
] as const

export function SiteNav({ onTabLink }: { onTabLink: (tab: string) => void }) {
  const { signupHref } = useStoreLink()
  const [announceHidden, setAnnounceHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [ddOpen, setDdOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const ddRef = useRef<HTMLDivElement>(null)
  const ddCloseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const drawerCloseBtnRef = useRef<HTMLButtonElement>(null)
  const drawerOpenBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDdOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDdOpen(false)
        closeDrawer()
      }
    }
    document.addEventListener("click", onDocClick)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("click", onDocClick)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden"
      const t = setTimeout(() => drawerCloseBtnRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
    document.body.style.overflow = ""
  }, [drawerOpen])

  function closeDrawer() {
    setDrawerOpen((open) => {
      if (open) drawerOpenBtnRef.current?.focus()
      return false
    })
  }

  function handleMouseEnter() {
    if (!window.matchMedia("(hover: hover)").matches) return
    clearTimeout(ddCloseTimer.current)
    setDdOpen(true)
  }

  function handleMouseLeave() {
    if (!window.matchMedia("(hover: hover)").matches) return
    ddCloseTimer.current = setTimeout(() => setDdOpen(false), 160)
  }

  return (
    <>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>

      {!announceHidden && (
        <div className={styles.announce}>
          <div className={`bq-container ${styles.announceInner}`}>
            <span className={styles.announceBadge}>Early access</span>
            <p>
              <span className={styles.announceLong}>Blaqora is opening to its first vendors. </span>
              <span className={styles.announceShort}>Early access is open. </span>
              <Link href={signupHref()}>Claim your store link</Link>
            </p>
            <button
              type="button"
              className={styles.announceClose}
              aria-label="Dismiss announcement"
              onClick={() => setAnnounceHidden(true)}
            >
              <X aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <header className={`${styles.nav} ${scrolled ? styles.isScrolled : ""}`}>
        <div className={`bq-container ${styles.navInner}`}>
          <Link className={styles.logo} href="/" aria-label="Blaqora home">
            <Image src="/blaqora-icon.png" alt="" width={34} height={34} />
            <Image className={styles.logoWord} src="/blaqora-wordmark-blue.png" alt="Blaqora" width={98} height={26} />
          </Link>

          <nav className={styles.navLinks} aria-label="Main">
            <div className={`${styles.dd} ${ddOpen ? styles.isOpen : ""}`} ref={ddRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <button
                type="button"
                className={`${styles.navLink} ${styles.ddBtn}`}
                aria-expanded={ddOpen}
                aria-controls="dd-sell"
                onClick={() => setDdOpen((o) => !o)}
              >
                What you can sell
                <ChevronDown className={styles.chev} aria-hidden="true" />
              </button>
              <div className={styles.ddPanel} id="dd-sell">
                <div className={styles.ddGrid}>
                  {SELL_ITEMS.map((item) => (
                    <a
                      key={item.tab}
                      className={styles.ddItem}
                      href="#sell"
                      onClick={(e) => {
                        e.preventDefault()
                        setDdOpen(false)
                        onTabLink(item.tab)
                      }}
                    >
                      <span className={`bq-icon ${item.iconClass}`}>
                        <item.icon aria-hidden="true" />
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.desc}</small>
                      </span>
                    </a>
                  ))}
                </div>
                <div className={styles.ddFoot}>
                  Sell all four from the same store link.
                  <a href="#how" onClick={() => setDdOpen(false)}>
                    See how it works
                  </a>
                </div>
              </div>
            </div>
            <a className={styles.navLink} href="#how">
              How it works
            </a>
            <a className={styles.navLink} href="#pricing">
              Pricing
            </a>
            <a className={styles.navLink} href="#faq">
              FAQ
            </a>
          </nav>

          <div className={styles.navActions}>
            <Link className={styles.navLogin} href="/login">
              Log in
            </Link>
            <Link className="bq-btn bq-btn--primary bq-btn--sm" href={signupHref()}>
              Create account
            </Link>
            <button
              type="button"
              className={styles.navBurger}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="drawer"
              ref={drawerOpenBtnRef}
              onClick={() => setDrawerOpen(true)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className={`${styles.drawer} ${drawerOpen ? styles.isOpen : ""}`} id="drawer" aria-hidden={!drawerOpen}>
        <div className={styles.drawerBackdrop} onClick={closeDrawer} />
        <div className={styles.drawerPanel} role="dialog" aria-modal="true" aria-label="Menu">
          <div className={styles.drawerTop}>
            <Link className={styles.logo} href="/" aria-label="Blaqora home">
              <Image src="/blaqora-icon.png" alt="" width={32} height={32} />
              <Image className={styles.logoWord} src="/blaqora-wordmark-blue.png" alt="Blaqora" width={92} height={24} />
            </Link>
            <button type="button" className={styles.drawerClose} aria-label="Close menu" ref={drawerCloseBtnRef} onClick={closeDrawer}>
              <X aria-hidden="true" />
            </button>
          </div>

          <p className={styles.drawerLabel}>What you can sell</p>
          <div className={styles.drawerSell}>
            {SELL_ITEMS.map((item) => (
              <a
                key={item.tab}
                href="#sell"
                onClick={(e) => {
                  e.preventDefault()
                  closeDrawer()
                  onTabLink(item.tab)
                }}
              >
                <span className={`bq-icon ${item.iconClass}`}>
                  <item.icon aria-hidden="true" />
                </span>
                {item.short}
              </a>
            ))}
          </div>

          <nav className={styles.drawerLinks} aria-label="Mobile">
            <a href="#how" onClick={closeDrawer}>
              How it works
            </a>
            <a href="#pricing" onClick={closeDrawer}>
              Pricing
            </a>
            <a href="#faq" onClick={closeDrawer}>
              FAQ
            </a>
            <Link href="/login" onClick={closeDrawer}>
              Log in
            </Link>
          </nav>

          <Link className="bq-btn bq-btn--primary bq-btn--lg bq-btn--block" href={signupHref()} onClick={closeDrawer}>
            Create account
          </Link>
        </div>
      </div>
    </>
  )
}
