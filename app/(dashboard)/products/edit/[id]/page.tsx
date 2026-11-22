"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ProductForm, type ProductFormInitial } from "@/components/products/product-form"

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<ProductFormInitial | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading")

  const load = useCallback(async () => {
    setState("loading")
    try {
      const res = await fetch(`/api/products/${id}`)
      if (res.status === 404) return setState("missing")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProduct(data.product)
      setState("ready")
    } catch {
      setState("error")
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (state === "loading") {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading product">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (state !== "ready" || !product) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-16 text-center" role="alert">
        <p className="font-semibold">{state === "missing" ? "Product not found" : "This product didn't load"}</p>
        <p className="text-sm text-muted-foreground">
          {state === "missing" ? "It may have been deleted." : "Check your connection and try again."}
        </p>
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

  return <ProductForm productType={product.product_type} initial={product} />
}
