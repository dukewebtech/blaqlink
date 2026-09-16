"use client"

import { useId, type KeyboardEvent } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useStoreLink } from "./store-link-context"
import styles from "./home.module.css"

export function ClaimField({
  className,
  buttonVariant = "primary",
}: {
  className?: string
  buttonVariant?: "primary" | "dark"
}) {
  const { slug, setRaw, signupHref } = useStoreLink()
  const inputId = useId()

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      ;(document.getElementById(`claim-cta-${inputId}`) as HTMLAnchorElement | null)?.click()
    }
  }

  return (
    <div className={`${styles.claim} ${className ?? ""}`}>
      <label className="bq-sr" htmlFor={inputId}>
        Choose your store link
      </label>
      <div className={styles.claimField}>
        <span className={styles.claimPrefix}>blaqora.store/</span>
        <input
          id={inputId}
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={30}
          placeholder="yourbrand"
          value={slug}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <Link
        id={`claim-cta-${inputId}`}
        href={signupHref()}
        className={`bq-btn bq-btn--${buttonVariant} bq-btn--lg`}
      >
        Claim my link
        <ArrowRight className="bq-btn__arrow" aria-hidden="true" />
      </Link>
    </div>
  )
}
