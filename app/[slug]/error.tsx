"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

// Last line of defence for every storefront page, including the order
// confirmation page: a buyer never sees a blank screen.
export default function StorefrontError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ slug: string }>()

  useEffect(() => {
    console.error("[storefront] render error:", error.digest ?? error.message)
  }, [error])

  return (
    <main className="bq-container" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "var(--bq-space-12) var(--bq-gutter)" }}>
      <div className="bq-empty" role="alert" style={{ maxWidth: 440 }}>
        <h1 className="bq-empty__title">Something went wrong on this page</h1>
        <p className="bq-empty__text">
          If you just paid, your payment is safe and your receipt is on its way by email. Please don&apos;t pay again.
        </p>
        <div style={{ display: "flex", gap: "var(--bq-space-2)", flexWrap: "wrap", justifyContent: "center", marginTop: "var(--bq-space-4)" }}>
          <button type="button" className="bq-btn bq-btn--primary" onClick={reset}>
            Try again
          </button>
          {params?.slug && (
            <Link href={`/${params.slug}`} className="bq-btn bq-btn--ghost">
              Back to store
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
