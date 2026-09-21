import { createAdminClient } from "@/lib/supabase/server"

/** Mirrors the client-side toSlug() in the onboarding steps — kept in sync intentionally. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Resolves `desiredSlug` (or a fallback if it slugifies to empty) to one that's
 * free in `users.store_slug`, appending -2, -3, ... on collision. Used both by
 * onboarding (so a taken slug never silently fails to save) and by the
 * one-off backfill for accounts that predate this fix.
 *
 * Always checks with the admin client, not a caller-supplied one — the
 * `users` table's RLS only lets a signed-in vendor see their own row, so a
 * request-scoped client would silently miss every other vendor's slug and
 * defeat the whole point of this check.
 */
export async function generateUniqueSlug(desiredName: string, excludeUserId?: string): Promise<string> {
  const supabase = createAdminClient()
  const base = slugify(desiredName) || "store"

  let candidate = base
  let suffix = 2
  // A handful of vendors could plausibly collide; this isn't a hot path.
  for (let attempts = 0; attempts < 1000; attempts++) {
    let query = supabase.from("users").select("id").eq("store_slug", candidate).limit(1)
    if (excludeUserId) query = query.neq("id", excludeUserId)
    const { data } = await query.maybeSingle()

    if (!data) return candidate
    candidate = `${base}-${suffix}`
    suffix++
  }

  // Astronomically unlikely, but never loop forever.
  return `${base}-${Date.now()}`
}
