"use client"

import { useState } from "react"
import Link from "next/link"
import { Banknote, Check, Copy, ExternalLink, Package, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const CONFETTI_COLOURS = ["var(--bq-tix)", "var(--bq-book)", "var(--bq-prod)", "var(--bq-dig)", "var(--bq-blue)"]

/** A short confetti burst; skipped entirely for people who prefer less motion. */
function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    delay: `${(i % 7) * 0.07}s`,
    duration: `${1.6 + (i % 5) * 0.25}s`,
    colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
    rotate: `${(i * 47) % 360}deg`,
    drift: `${((i % 9) - 4) * 14}px`,
  }))
  return (
    <div aria-hidden="true" className="bq-confetti pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
      <style>{`
        .bq-confetti span { position: absolute; top: -12px; width: 8px; height: 12px; border-radius: 2px; opacity: 0;
          animation: bq-confetti-fall var(--d) cubic-bezier(.2,.7,.4,1) var(--delay) 1 forwards; }
        @keyframes bq-confetti-fall {
          0% { opacity: 1; transform: translate3d(0, 0, 0) rotate(0); }
          100% { opacity: 0; transform: translate3d(var(--drift), 340px, 0) rotate(var(--rot)); }
        }
        @media (prefers-reduced-motion: reduce) { .bq-confetti { display: none; } }
      `}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={
            {
              left: p.left,
              background: p.colour,
              "--delay": p.delay,
              "--d": p.duration,
              "--rot": p.rotate,
              "--drift": p.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function WelcomeStep({
  firstName,
  storeSlug,
  verified,
  bankConnected,
}: {
  firstName: string
  storeSlug: string
  verified: boolean
  bankConnected: boolean
}) {
  const [copied, setCopied] = useState(false)
  const storeUrl = `blaqora.store/${storeSlug}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(`https://${storeUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked; the link is still visible to copy by hand */
    }
  }

  const todo = [
    !verified && { href: "/settings/verify", icon: ShieldCheck, title: "Verify your identity", text: "Until then, your store shows buyers it isn't verified yet." },
    !bankConnected && { href: "/settings/payout", icon: Banknote, title: "Add your bank account", text: "So you can withdraw what you earn." },
  ].filter(Boolean) as { href: string; icon: typeof ShieldCheck; title: string; text: string }[]

  return (
    <Card className="relative overflow-hidden p-6 text-center sm:p-8 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-500">
      <Confetti />
      <div className="relative space-y-5">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-700" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{firstName ? `Welcome to Blaqora, ${firstName}!` : "Welcome to Blaqora!"}</h1>
          <p className="text-muted-foreground">Your store is ready. Add something to sell and share your link.</p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2 pl-3 text-left">
          <span className="min-w-0 flex-1 truncate font-mono text-sm">{storeUrl}</span>
          <Button type="button" variant="outline" size="sm" onClick={copy} aria-label="Copy store link">
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild size="lg">
            <Link href="/products/choose-type">
              <Package className="h-4 w-4" aria-hidden="true" /> Add a product
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/${storeSlug}`} target="_blank" rel="noopener">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> View store
            </Link>
          </Button>
        </div>

        {todo.length > 0 && (
          <div className="space-y-2 text-left">
            <p className="text-sm font-semibold">Still to do</p>
            {todo.map((t) => (
              <Link key={t.href} href={t.href} className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
                <t.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-medium">{t.title}</span>
                  <span className="block text-sm text-muted-foreground">{t.text}</span>
                </span>
              </Link>
            ))}
          </div>
        )}

        <Link href="/dashboard" className="inline-block text-sm font-medium text-muted-foreground hover:text-foreground">
          Go to dashboard
        </Link>
      </div>
    </Card>
  )
}
