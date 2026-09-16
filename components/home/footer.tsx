import Link from "next/link"
import { Instagram, X as XIcon, Linkedin } from "lucide-react"
import { useStoreLink } from "./store-link-context"
import type { UseCaseTab } from "./use-case-tabs"
import styles from "./home.module.css"

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width={19} height={19} aria-hidden="true" fill="currentColor" stroke="none">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.14-1.4V5.82zm-3.14-1.4A4.28 4.28 0 0 1 12.52 2h-3.1v14.14a2.6 2.6 0 1 1-1.84-2.49v-3.14A5.74 5.74 0 1 0 12.52 21V9.4a7.4 7.4 0 0 0 4.08 1.24V7.5a4.28 4.28 0 0 1-3.14-1.4v-.28z" />
    </svg>
  )
}

export function Footer({ onTabLink }: { onTabLink: (tab: UseCaseTab) => void }) {
  const { signupHref } = useStoreLink()

  return (
    <footer className={styles.foot}>
      <div className="bq-container">
        <div className={styles.footGrid}>
          <div className={styles.footBrand}>
            <Link className={styles.logo} href="/" aria-label="Blaqora home">
              <img src="/blaqora-icon.png" alt="" width={34} height={34} />
              <img className={styles.logoWord} src="/blaqora-wordmark-white.png" alt="Blaqora" width={98} height={26} />
            </Link>
            <p>One link to sell tickets, bookings, products and digital downloads.</p>
            <div className={styles.footSocial}>
              <a href="https://instagram.com/blaqorahq" aria-label="Blaqora on Instagram">
                <Instagram aria-hidden="true" />
              </a>
              <a href="https://x.com/blaqorahq" aria-label="Blaqora on X">
                <XIcon aria-hidden="true" />
              </a>
              <a href="https://tiktok.com/@blaqorahq" aria-label="Blaqora on TikTok">
                <TikTokIcon />
              </a>
              <a href="https://linkedin.com/company/blaqorahq" aria-label="Blaqora on LinkedIn">
                <Linkedin aria-hidden="true" />
              </a>
            </div>
          </div>

          <nav className={styles.footCol} aria-label="Sell">
            <p>Sell</p>
            {(
              [
                ["tickets", "Event tickets"],
                ["bookings", "Bookings"],
                ["products", "Physical products"],
                ["digital", "Digital products"],
              ] as [UseCaseTab, string][]
            ).map(([tab, label]) => (
              <a
                key={tab}
                href="#sell"
                onClick={(e) => {
                  e.preventDefault()
                  onTabLink(tab)
                }}
              >
                {label}
              </a>
            ))}
          </nav>

          <nav className={styles.footCol} aria-label="Company">
            <p>Company</p>
            <a href="/about">About</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="mailto:hello@blaqora.store">Contact</a>
          </nav>

          <nav className={styles.footCol} aria-label="Account">
            <p>Account</p>
            <Link href={signupHref()}>Create account</Link>
            <Link href="/login">Log in</Link>
            <a href="mailto:hello@blaqora.store">hello@blaqora.store</a>
          </nav>
        </div>

        <div className={styles.footBase}>
          <span>© 2026 Blaqora. All rights reserved.</span>
          <div className={styles.footLegal}>
            <a href="#terms">Terms</a>
            <a href="#privacy">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
