/**
 * The canonical public URL for the app — safe to use anywhere the link ends
 * up somewhere other than the developer's own browser: email bodies, digital
 * download links, ticket QR codes, payment-provider callback/redirect URLs,
 * the storefront's og:url for WhatsApp/Instagram link previews.
 *
 * Deliberately hardcoded rather than read from NEXT_PUBLIC_APP_URL. That env
 * var has been found pointing at a local dev address (http://localhost:3000)
 * and, separately, at a v0.app preview deployment (*.vusercontent.net) — two
 * different wrong values in production, both silently breaking every link
 * built from it (dead "shop again" links, a Blaqora logo that fails to load,
 * digital-download links customers can't reach, a Korapay webhook URL that
 * would mean payments never confirm). Rather than trying to pattern-match
 * every way that variable can be wrong, every consumer of "the site's real
 * URL" goes through here, and here always resolves to the one true domain.
 */
export function getAppUrl(): string {
  return "https://blaqora.store"
}
