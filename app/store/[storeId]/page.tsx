"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { CrystalClearStorefront } from "@/components/store/templates/crystal-clear-storefront"
import { ObsidianGlassStorefront } from "@/components/store/templates/obsidian-glass-storefront"
import { AuroraFrostStorefront } from "@/components/store/templates/aurora-frost-storefront"
import { DefaultStorefront } from "@/components/store/templates/default-storefront"

interface Product {
  id: string
  title: string
  price: number
  images: string[]
  product_type: string
  category: string
  description: string
  stock_quantity?: number
  status: string
}

interface Category {
  id: string
  name: string
  product_type: string
  image_url?: string
  status: string
}

interface StoreInfo {
  id: string
  business_name: string
  full_name: string
  location: string
  profile_image?: string
  store_logo_url?: string // Added store_logo_url field
  phone?: string
  email?: string
  store_template?: string // Added store_template field
}

export default function PublicStorePage({ params }: { params: { storeId: string } }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartCount, setCartCount] = useState(0)
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchStoreData()
  }, [params.storeId])

  const fetchStoreData = async () => {
    try {
      setLoading(true)

      const [storeRes, productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/public/store-info?storeId=${params.storeId}`),
        fetch(`/api/public/products?storeId=${params.storeId}`),
        fetch(`/api/public/categories?storeId=${params.storeId}`),
      ])

      if (!storeRes.ok) {
        toast({
          title: "Store not found",
          description: "The store you're looking for doesn't exist.",
          variant: "destructive",
        })
        return
      }

      const storeData = await storeRes.json()
      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()

      setStoreInfo(storeData.storeInfo)
      setProducts(productsData.products || [])
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error("Error fetching store data:", error)
      toast({
        title: "Error",
        description: "Failed to load store data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    )
  }

  if (!storeInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground">The store you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  console.log("[v0] Store template value:", storeInfo.store_template, "Type:", typeof storeInfo.store_template)

  switch (storeInfo.store_template) {
    case "crystal-clear":
      return (
        <CrystalClearStorefront
          storeInfo={storeInfo}
          products={products}
          categories={categories}
          storeId={params.storeId}
        />
      )
    case "obsidian-glass":
      return (
        <ObsidianGlassStorefront
          storeInfo={storeInfo}
          products={products}
          categories={categories}
          storeId={params.storeId}
        />
      )
    case "aurora-frost":
      return (
        <AuroraFrostStorefront
          storeInfo={storeInfo}
          products={products}
          categories={categories}
          storeId={params.storeId}
        />
      )
    default:
      // Default template (original storefront)
      return (
        <DefaultStorefront
          storeInfo={storeInfo}
          products={products}
          categories={categories}
          storeId={params.storeId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          cartCount={cartCount}
          setCartCount={setCartCount}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      )
  }
}
