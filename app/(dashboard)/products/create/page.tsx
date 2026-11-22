import { redirect } from "next/navigation"
import { ProductForm } from "@/components/products/product-form"
import type { ProductType } from "@/lib/products/schema"

const TYPES: ProductType[] = ["physical", "digital", "event", "appointment"]

// One shared form for every product type (it sends ticket types, variants
// and booking times in the shape the server and database expect).
export default async function CreateProductPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams
  if (!type || !TYPES.includes(type as ProductType)) redirect("/products/choose-type")
  return <ProductForm productType={type as ProductType} />
}
