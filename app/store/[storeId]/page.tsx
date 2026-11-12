import { notFound, permanentRedirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Old storefront address. Every store now lives at /{slug}, with one shared
// checkout; anything still linking here is sent there.
export default async function LegacyStoreRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params
  if (!UUID_RE.test(storeId)) notFound()
  const { data } = await createAdminClient().from("users").select("id, store_slug").eq("id", storeId).maybeSingle()
  if (!data) notFound()
  permanentRedirect(`/${data.store_slug || data.id}`)
}
