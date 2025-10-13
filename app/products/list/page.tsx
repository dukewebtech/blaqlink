"use client"

import type React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  FolderPlus,
  Upload,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

type Product = {
  id: string
  product_type: "digital" | "physical" | "event" | "appointment"
  title: string
  description: string | null
  price: number
  category: string | null
  sku: string | null
  stock_quantity: number | null
  status: string
  created_at: string
  image_url?: string | null
}

const categories = [
  { name: "All Products", type: null, active: true },
  { name: "Digital Products", type: "digital", active: false },
  { name: "Physical Products", type: "physical", active: false },
  { name: "Event Tickets", type: "event", active: false },
  { name: "Appointments", type: "appointment", active: false },
]

export default function ProductListPage() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const [categoryImage, setCategoryImage] = useState<File | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [selectedType])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = selectedType ? `/api/products?type=${selectedType}` : "/api/products"
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products")
      console.error("[v0] Error fetching products:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase()
    return (
      product.title.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    )
  })

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete product")
      }

      // Refresh products list
      fetchProducts()
    } catch (err) {
      console.error("[v0] Error deleting product:", err)
      alert("Failed to delete product")
    }
  }

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Creating category:", { categoryName, categoryDescription, categoryImage })
    setCategoryName("")
    setCategoryDescription("")
    setCategoryImage(null)
    setOpen(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getProductTypeBadge = (type: string) => {
    const badges = {
      digital: { label: "Digital", className: "bg-blue-500/20 text-blue-700 hover:bg-blue-500/30" },
      physical: { label: "Physical", className: "bg-green-500/20 text-green-700 hover:bg-green-500/30" },
      event: { label: "Event", className: "bg-purple-500/20 text-purple-700 hover:bg-purple-500/30" },
      appointment: { label: "Appointment", className: "bg-orange-500/20 text-orange-700 hover:bg-orange-500/30" },
    }
    return badges[type as keyof typeof badges] || { label: type, className: "" }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Dashboard</span>
            <span>›</span>
            <span>Product</span>
            <span>›</span>
            <span className="text-primary font-medium">
              {selectedType ? categories.find((c) => c.type === selectedType)?.name : "All Products"}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedType ? categories.find((c) => c.type === selectedType)?.name : "All Products"}
          </h1>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for id, name, category"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 transition-all duration-300 hover:scale-105 bg-transparent">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2 transition-all duration-300 hover:scale-105 bg-transparent">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 transition-all duration-300 hover:scale-105 bg-transparent">
                  <FolderPlus className="h-4 w-4" />
                  Create Category
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                {/* Sticky Header */}
                <SheetHeader className="sticky top-0 bg-background pb-4 border-b z-10">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-xl">Create Category</SheetTitle>
                    <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-all duration-200 hover:opacity-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </SheetClose>
                  </div>
                </SheetHeader>

                {/* Form Content */}
                <form onSubmit={handleCreateCategory} className="flex-1 flex flex-col gap-6 py-6 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Category Name */}
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500">
                      <Label htmlFor="category-name" className="text-sm font-medium">
                        Category Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="category-name"
                        placeholder="e.g., Summer Collection"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        required
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500 delay-75">
                      <Label htmlFor="category-description" className="text-sm font-medium">
                        Description <span className="text-muted-foreground text-xs">(Optional)</span>
                      </Label>
                      <Textarea
                        id="category-description"
                        placeholder="Brief description of this category..."
                        value={categoryDescription}
                        onChange={(e) => setCategoryDescription(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500 delay-150">
                      <Label htmlFor="category-image" className="text-sm font-medium">
                        Category Image <span className="text-muted-foreground text-xs">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="category-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCategoryImage(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <label
                          htmlFor="category-image"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer transition-all duration-300 hover:border-primary hover:bg-primary/5 group"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                          <p className="mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors duration-300">
                            {categoryImage ? categoryImage.name : "Click to upload image"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 4MB</p>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Save Button - Sticky at bottom */}
                  <div className="mt-auto pt-6 border-t sticky bottom-0 bg-background">
                    <Button
                      type="submit"
                      className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                      size="lg"
                    >
                      Save Category
                    </Button>
                  </div>
                </form>
              </SheetContent>
            </Sheet>
            <Button
              className="gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={() => router.push("/products/choose-type")}
            >
              <Plus className="h-4 w-4" />
              New Product
            </Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.name}
              variant={selectedType === category.type ? "default" : "ghost"}
              className={cn(
                "rounded-full whitespace-nowrap transition-all duration-300",
                selectedType === category.type && "bg-primary/10 text-primary hover:bg-primary/20",
              )}
              onClick={() => setSelectedType(category.type)}
            >
              {category.name} ({products.filter((p) => !category.type || p.product_type === category.type).length})
            </Button>
          ))}
        </div>

        {/* Products Table */}
        <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading products...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchProducts}>Retry</Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No products found</p>
              <Button onClick={() => router.push("/products/choose-type")}>Create Your First Product</Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product, index) => (
                    <TableRow
                      key={product.id}
                      className="group transition-all duration-200 hover:bg-muted/50 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url || "/placeholder.svg?height=48&width=48"}
                            alt={product.title}
                            className="w-12 h-12 rounded-lg object-cover ring-2 ring-border transition-all duration-300 group-hover:ring-primary"
                          />
                          <div>
                            <p className="text-xs text-muted-foreground">{product.sku || product.id.slice(0, 8)}</p>
                            <p className="font-medium">{product.title}</p>
                            {product.category && (
                              <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getProductTypeBadge(product.product_type).className}>
                          {getProductTypeBadge(product.product_type).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{formatPrice(product.price)}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {product.product_type === "physical" || product.product_type === "event"
                            ? product.stock_quantity || "N/A"
                            : "Digital"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.status === "published" ? "default" : "secondary"}
                          className={cn(
                            "transition-all duration-300 capitalize",
                            product.status === "published" &&
                              "bg-success/20 text-success-foreground hover:bg-success/30",
                            product.status === "draft" && "bg-muted text-muted-foreground hover:bg-muted/80",
                          )}
                        >
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 transition-all duration-300 hover:scale-110"
                            onClick={() => router.push(`/products/${product.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 transition-all duration-300 hover:scale-110"
                            onClick={() => router.push(`/products/edit/${product.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive transition-all duration-300 hover:scale-110"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Page</span>
                  <Select defaultValue="1">
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 transition-all duration-300 hover:scale-110 bg-transparent"
                    disabled
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 transition-all duration-300 hover:scale-110 bg-transparent"
                    disabled
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
