"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { StoreLinkProvider } from "@/components/home/store-link-context"
import { SiteNav } from "@/components/home/site-nav"
import { Footer } from "@/components/home/footer"
import { LEGAL, LEGAL_DOCS, type LegalDocHref } from "@/lib/legal"
import styles from "./legal.module.css"

export interface LegalSection {
  id: string
  title: string
  body: ReactNode
}

// The home nav/footer "Sell" links switch tabs in place on the homepage; from
// a legal page they just go back to that section.
function goToSell() {
  window.location.href = "/#sell"
}

export function LegalPage({
  current,
  title,
  intro,
  sections,
}: {
  current: LegalDocHref
  title: string
  intro: ReactNode
  sections: LegalSection[]
}) {
  return (
    <StoreLinkProvider>
      <SiteNav onTabLink={goToSell} />
      <main id="main">
        <header className={styles.header}>
          <div className="bq-container">
            <p className={styles.eyebrow}>Legal</p>
            <h1 className={`bq-h2 ${styles.title}`}>{title}</h1>
            <p className={`bq-lead ${styles.intro}`}>{intro}</p>
            <span className={`bq-meta ${styles.updated}`}>Last updated {LEGAL.lastUpdated}</span>
          </div>
        </header>

        <div className={`bq-container ${styles.layout}`}>
          <aside className={styles.aside}>
            <nav className={styles.docs} aria-label="Legal documents">
              {LEGAL_DOCS.map((doc) => (
                <Link
                  key={doc.href}
                  href={doc.href}
                  className={`${styles.doc} ${doc.href === current ? styles.docActive : ""}`}
                  aria-current={doc.href === current ? "page" : undefined}
                >
                  {doc.label}
                </Link>
              ))}
            </nav>

            <details className={styles.toc} open>
              <summary>On this page</summary>
              <ol>
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a className={styles.tocLink} href={`#${s.id}`}>
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          </aside>

          <div>
            <article className={styles.article}>
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className={styles.section} aria-labelledby={`${s.id}-title`}>
                  <h2 id={`${s.id}-title`} className={styles.sectionTitle}>
                    {i + 1}. {s.title}
                  </h2>
                  {s.body}
                </section>
              ))}
            </article>

            <div className={`bq-card bq-card--soft ${styles.contact}`}>
              <h2 className="bq-card__title">Questions about this policy?</h2>
              <p className="bq-card__text">Email us and we&apos;ll get back to you.</p>
              <a className={`bq-btn bq-btn--primary ${styles.contactBtn}`} href={`mailto:${LEGAL.contactEmail}`}>
                Email {LEGAL.contactEmail}
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer onTabLink={goToSell} />
    </StoreLinkProvider>
  )
}
