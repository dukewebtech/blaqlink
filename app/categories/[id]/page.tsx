"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil, Trash2, Loader2, Tag, Package } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"

type Category = {
  id: string
  name: string
  product_type: string
  description: string
  image_url: string
  status: string
  products: { count: number }[]
  created_at: string
}

const productTypeLabels = {
  digital: "Digital Product",
  physical: "Physical Product",
  event: "Event Tickets",
  appointment: "Appointments",
}

export default function CategoryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.id as string

  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategory()
  }, [categoryId])

  const fetchCategory = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/categories/${categoryId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch category")
      }

      const data = await response.json()
      setCategory(data.category)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load category")
      console.error("[v0] Error fetching category:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete category")
      }

      router.push("/categories")
    } catch (err) {
      console.error("[v0] Error deleting category:", err)
      alert("Failed to delete category")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading category...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !category) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-destructive mb-4">{error || "Category not found"}</p>
          <Button onClick={() => router.push("/categories")}>Back to Categories</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              className="gap-2 mb-4 -ml-2 hover:bg-transparent"
              onClick={() => router.push("/categories")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Categories
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
              <Badge
                variant="outline"
                className={
                  category.status === "active"
                    ? "bg-purple-100 text-purple-700 border-purple-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }
              >
                {category.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Category ID: {category.id}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => router.push(`/categories/edit/${category.id}`)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" className="gap-2" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Image */}
            {category.image_url && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Category Image</h2>
                <img
                  src={category.image_url || "/placeholder.svg"}
                  alt={category.name}
                  className="w-full max-w-md h-64 object-cover rounded-lg ring-2 ring-border"
                />
              </Card>
            )}

            {/* Description */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {category.description || "No description provided"}
              </p>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Product Type */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Product Type</h2>
              </div>
              <Badge variant="secondary" className="text-base">
                {productTypeLabels[category.product_type as keyof typeof productTypeLabels]}
              </Badge>
            </Card>

            {/* Linked Products */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Linked Products</h2>
              </div>
              <p className="text-3xl font-bold">{category.products?.[0]?.count || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">products in this category</p>
            </Card>

            {/* Metadata */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Metadata</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(category.created_at)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
