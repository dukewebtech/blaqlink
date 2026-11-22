"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, ExternalLink, FileText, Loader2, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TypeBadge } from "@/components/products/type-badge"
import { useVendorUser } from "@/components/dashboard/vendor-user-context"
import { formatNaira } from "@/lib/money"
import { formatEventDate } from "@/lib/dates"

interface Product {
  id: string
  product_type: "physical" | "digital" | "event" | "appointment"
  status: string
  title: string
  description: string | null
  price: number
  compare_at_price: number | null
  category: string | null
  images: string[] | null
  file_urls: string[] | null
  download_limit: number | null
  event_date: string | null
  event_location: string | null
  ticket_tiers: { id: string; name: string; price: number; quantity_total: number | null; quantity_sold: number }[]
  sku: string | null
  stock_quantity: number | null
  variants: { id: string; size: string | null; color_name: string | null; color_hex: string | null; stock_quantity: number; price?: number | string | null }[]
  option1_name?: string | null
  option2_name?: string | null
  duration_minutes: number | null
  available_days: string[] | null
  time_slots: string[] | null
}

function fileName(path: string) {
  return (path.split("/").pop() ?? path).replace(/^\d+-/, "")
}

/** A labelled row of facts; wraps cleanly at 390px. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  )
}

export default function ProductViewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user: vendor } = useVendorUser()
  const [product, setProduct] = useState<Product | null>(null)
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setState("loading")
    try {
      const res = await fetch(`/api/products/${id}`)
      if (res.status === 404) return setState("missing")
      if (!res.ok) throw new Error()
      const { product: p } = (await res.json()) as { product: Product }
      setProduct(p)
      if (p.category) {
        const cats = await fetch("/api/categories").then((r) => (r.ok ? r.json() : { categories: [] }))
        setCategoryName(cats.categories?.find((c: { id: string; name: string }) => c.id === p.category)?.name ?? null)
      }
      setState("ready")
    } catch {
      setState("error")
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function remove() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error)
      toast.success("Product deleted")
      router.push("/products-list")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "We couldn't delete this product. Please try again.")
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-4xl space-y-4" aria-busy="true" aria-label="Loading product">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-muted sm:aspect-[16/7]" />
      </div>
    )
  }

  if (state !== "ready" || !product) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-16 text-center" role="alert">
        <p className="font-semibold">{state === "missing" ? "Product not found" : "This product didn't load"}</p>
        <p className="text-sm text-muted-foreground">{state === "missing" ? "It may have been deleted." : "Check your connection and try again."}</p>
        {state === "missing" ? (
          <Button asChild>
            <Link href="/products-list">Back to products</Link>
          </Button>
        ) : (
          <Button onClick={load}>Try again</Button>
        )}
      </div>
    )
  }

  const p = product
  const images = p.images?.length ? p.images : []
  const tiers = p.ticket_tiers ?? []
  const variants = p.variants ?? []
  const option1 = p.option1_name || "Size"
  const option2 = p.option2_name || "Colour"
  const totalStock = variants.length ? variants.reduce((s, v) => s + v.stock_quantity, 0) : p.stock_quantity
  const priceLabel =
    p.product_type === "event" && tiers.length > 1 ? `From ${formatNaira(Math.min(...tiers.map((t) => Number(t.price))))}` : formatNaira(p.price)
  const storeUrl = vendor?.store_slug ? `/${vendor.store_slug}` : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/products-list" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Products
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={p.product_type} />
          <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              p.status === "published" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
            }`}
          >
            {p.status === "published" ? "Published" : "Draft"}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight break-words md:text-3xl">{p.title}</h1>
        <p className="text-2xl font-bold tabular-nums">
          {priceLabel}
          {p.compare_at_price ? <span className="ml-2 text-base font-medium text-muted-foreground line-through">{formatNaira(p.compare_at_price)}</span> : null}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button asChild>
            <Link href={`/products/edit/${p.id}`}>
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
            </Link>
          </Button>
          {storeUrl && p.status === "published" && (
            <Button variant="outline" asChild>
              <Link href={storeUrl} target="_blank" rel="noopener">
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> View in store
              </Link>
            </Button>
          )}
          <Button variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
          </Button>
        </div>
      </header>

      {images.length > 0 && (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={i === 0 ? p.title : `${p.title}, photo ${i + 1}`}
              className="aspect-square w-[78%] shrink-0 snap-start rounded-lg border object-cover sm:w-full"
            />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {p.description && (
            <Card className="p-5">
              <h2 className="mb-2 font-semibold">Description</h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{p.description}</p>
            </Card>
          )}

          {p.product_type === "event" && tiers.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Ticket types</h2>
              <ul className="divide-y">
                {tiers.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate font-medium">{t.name}</span>
                    <span className="shrink-0 text-right tabular-nums">
                      {formatNaira(t.price)}
                      <span className="block text-xs text-muted-foreground">
                        {t.quantity_sold} sold{t.quantity_total != null ? ` of ${t.quantity_total}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {p.product_type === "physical" && variants.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Options</h2>
              <ul className="divide-y">
                {variants.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      {v.color_hex && <span className="h-4 w-4 shrink-0 rounded-full border" style={{ background: v.color_hex }} aria-hidden="true" />}
                      <span className="truncate">
                        {[v.size && `${option1}: ${v.size}`, v.color_name && `${option2}: ${v.color_name}`].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 tabular-nums">
                      {v.price != null && <span className="font-medium">{formatNaira(Number(v.price))}</span>}
                      <span className={v.stock_quantity === 0 ? "text-destructive" : ""}>
                        {v.stock_quantity === 0 ? "Sold out" : `${v.stock_quantity} left`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {p.product_type === "digital" && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Files buyers get</h2>
              {p.file_urls?.length ? (
                <ul className="space-y-2">
                  {p.file_urls.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="min-w-0 truncate">{fileName(f)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No file yet. Edit the product to upload one before publishing.</p>
              )}
            </Card>
          )}

          {p.product_type === "appointment" && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Session times</h2>
              {p.time_slots?.length ? (
                <div className="flex flex-wrap gap-2">
                  {p.time_slots.map((t) => (
                    <span key={t} className="rounded-md border px-2.5 py-1 text-sm tabular-nums">
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No times set yet. Edit the booking to add your hours.</p>
              )}
            </Card>
          )}
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-1 font-semibold">Details</h2>
          <dl className="divide-y">
            <Fact label="Category">{categoryName ?? (p.category ? "—" : "None")}</Fact>
            {p.product_type === "physical" && <Fact label="In stock">{totalStock ?? "Not tracked"}</Fact>}
            {p.product_type === "physical" && p.sku && <Fact label="SKU">{p.sku}</Fact>}
            {p.product_type === "digital" && <Fact label="Download limit">{p.download_limit ?? "Unlimited"}</Fact>}
            {p.product_type === "event" && p.event_date && <Fact label="Date">{formatEventDate(p.event_date)}</Fact>}
            {p.product_type === "event" && p.event_location && <Fact label="Venue">{p.event_location}</Fact>}
            {p.product_type === "appointment" && p.duration_minutes && <Fact label="Length">{p.duration_minutes} minutes</Fact>}
            {p.product_type === "appointment" && p.available_days?.length ? <Fact label="Days">{p.available_days.join(", ")}</Fact> : null}
          </dl>
        </Card>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={(v) => !deleting && setConfirmDelete(v)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {p.title}?</AlertDialogTitle>
            <AlertDialogDescription>It disappears from your store straight away. Past orders keep their details. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
