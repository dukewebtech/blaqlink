/**
 * The canonical public URL for the app — safe to use anywhere the link ends
 * up somewhere other than the developer's own browser: email bodies, digital
 * download links, ticket QR codes, payment-provider callback/redirect URLs.
 *
 * NEXT_PUBLIC_APP_URL is meant to be overridable per-environment, but a local
 * dev value (http://localhost:3000, left in .env.local) must never leak into
 * something a real customer's mail client or browser is asked to open — that
 * produced broken "shop again" links, dead digital-download links, and
 * tickets whose QR code pointed at a machine only the developer can reach.
 * Falls back to the known-good production domain instead.
 */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured && !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(configured)) {
    return configured.replace(/\/+$/, "")
  }
  return "https://blaqora.store"
}
