/** Only same-site paths, so an email link can't redirect someone off Blaqora. */
export function safeNext(next: string | null, fallback = "/onboarding"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback
  return next
}
