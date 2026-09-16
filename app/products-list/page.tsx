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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
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
  ChevronDown,
  X,
  FolderPlus,
  Upload,
  Loader2,
  FileUp,
  Globe,
  EyeOff,
  Archive,
  Package,
  Tag,
  Copy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"

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
  images?: string[] | null
}

type ProductCategory = {
  id: string
  name: string
  product_type: string
}

const PRODUCT_TYPE_FILTERS = [
  { name: "All Products", type: null, active: true },
  { name: "Digital Products", type: "digital", active: false },
  { name: "Physical Products", type: "physical", active: false },
  { name: "Event Tickets", type: "event", active: false },
  { name: "Appointments", type: "appointment", active: false },
]

export default function ProductListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const [categoryImage, setCategoryImage] = useState<File | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [bulkBusy, setBulkBusy] = useState<string | null>(null)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [stockQuantityInput, setStockQuantityInput] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [selectedType])

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {})
  }, [])

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
      console.log("[v0] Fetched products:", data.products?.length, "products")
      if (data.products?.length > 0) {
        console.log("[v0] First product images:", data.products[0].images)
      }
      setProducts(data.products || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products")
      console.error("[v0] Error fetching products:", err)
    } finally {
      setLoading(false)
    }
  }

  const categoryNameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase()
    const categoryName = (product.category && categoryNameById.get(product.category)) || ""
    return (
      product.title.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      categoryName.toLowerCase().includes(query)
    )
  })

  const selectedProducts = products.filter((p) => selectedIds.has(p.id))
  const selectedTypeSet = new Set(selectedProducts.map((p) => p.product_type))
  const selectionCommonType = selectedTypeSet.size === 1 ? [...selectedTypeSet][0] : null
  const categoryOptionsForSelection = selectionCommonType
    ? categories.filter((c) => c.product_type === selectionCommonType)
    : []

  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id))
  const someFilteredSelected = filteredProducts.some((p) => selectedIds.has(p.id))

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filteredProducts.forEach((p) => next.delete(p.id))
      } else {
        filteredProducts.forEach((p) => next.add(p.id))
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function callBulkAction(action: string, extra: Record<string, unknown> = {}) {
    setBulkBusy(action)
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selectedIds), ...extra }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")
      return data
    } finally {
      setBulkBusy(null)
    }
  }

  async function handleBulkStatus(status: "draft" | "published" | "archived") {
    try {
      const data = await callBulkAction("status", { status })
      const n = data.updated?.length || 0
      if (n) toast.success(`${n} product${n === 1 ? "" : "s"} ${status === "published" ? "published" : status === "draft" ? "moved to draft" : "archived"}`)
      else toast.error("Nothing was updated")
      clearSelection()
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status")
    }
  }

  async function handleBulkDelete() {
    try {
      const data = await callBulkAction("delete")
      const deleted = data.deleted?.length || 0
      const failed = data.failed?.length || 0
      if (deleted) toast.success(`Deleted ${deleted} product${deleted === 1 ? "" : "s"}`)
      if (failed) toast.error(`${failed} product${failed === 1 ? "" : "s"} couldn't be deleted (likely tied to existing orders)`)
      setDeleteDialogOpen(false)
      clearSelection()
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete products")
    }
  }

  async function handleBulkStock(mode: "set" | "out_of_stock") {
    const quantity = mode === "set" ? Number(stockQuantityInput) : 0
    if (mode === "set" && (!Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity))) {
      toast.error("Enter a whole number of 0 or more")
      return
    }
    try {
      const data = await callBulkAction("stock", { mode, quantity })
      const updated = data.updated?.length || 0
      const skipped = data.skipped?.length || 0
      if (updated) toast.success(`Stock updated for ${updated} product${updated === 1 ? "" : "s"}`)
      if (skipped) {
        toast.message(`${skipped} product${skipped === 1 ? "" : "s"} skipped`, {
          description: data.skipped.map((s: { title: string; reason: string }) => `${s.title}: ${s.reason}`).join("; "),
        })
      }
      if (!updated && !skipped) toast.error("Nothing to update")
      setStockDialogOpen(false)
      setStockQuantityInput("")
      clearSelection()
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update stock")
    }
  }

  async function handleBulkCategory(categoryId: string | null) {
    try {
      const data = await callBulkAction("category", { categoryId })
      const n = data.updated?.length || 0
      if (n) toast.success(categoryId ? `Category assigned to ${n} product${n === 1 ? "" : "s"}` : `Category removed from ${n} product${n === 1 ? "" : "s"}`)
      else toast.error("Nothing was updated")
      clearSelection()
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign category")
    }
  }

  async function handleBulkDuplicate() {
    try {
      const data = await callBulkAction("duplicate")
      const n = data.created?.length || 0
      if (n) toast.success(`Duplicated ${n} product${n === 1 ? "" : "s"} as draft${n === 1 ? "" : "s"}`)
      else toast.error("Nothing was duplicated")
      clearSelection()
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate products")
    }
  }

  function handleExportSelected() {
    if (selectedProducts.length === 0) {
      toast.error("No products selected")
      return
    }
    const header = ["Title", "SKU", "Type", "Category", "Price", "Stock", "Status", "Created At"]
    const rows = selectedProducts.map((p) => [
      p.title,
      p.sku || "",
      p.product_type,
      (p.category && categoryNameById.get(p.category)) || "",
      String(p.price ?? ""),
      p.product_type === "physical" ? String(p.stock_quantity ?? "") : "",
      p.status,
      new Date(p.created_at).toISOString(),
    ])
    const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Exported ${selectedProducts.length} product${selectedProducts.length === 1 ? "" : "s"}`)
  }

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
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2 flex-wrap">
            <span>Dashboard</span>
            <span>›</span>
            <span>Product</span>
            <span>›</span>
            <span className="text-primary font-medium">
              {selectedType ? PRODUCT_TYPE_FILTERS.find((c) => c.type === selectedType)?.name : "All Products"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {selectedType ? PRODUCT_TYPE_FILTERS.find((c) => c.type === selectedType)?.name : "All Products"}
          </h1>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for id, name, category"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2 bg-transparent h-9 text-sm">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent h-9 text-sm">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-transparent h-9 text-sm"
              onClick={() => router.push("/products/import")}
            >
              <FileUp className="h-4 w-4" />
              Import
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent h-9 text-sm">
                  <FolderPlus className="h-4 w-4" />
                  Category
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
              className="gap-2 h-9 text-sm ml-auto"
              onClick={() => router.push("/products/choose-type")}
            >
              <Plus className="h-4 w-4" />
              New Product
            </Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {PRODUCT_TYPE_FILTERS.map((category) => (
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

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <Card className="p-3 sm:p-4 border-primary/30 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium mr-1">
                {selectedIds.size} selected
              </span>
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-muted-foreground" onClick={clearSelection}>
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>

              <div className="flex-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent" disabled={bulkBusy !== null}>
                    <Globe className="h-3.5 w-3.5" />
                    Status
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkStatus("published")}>
                    <Globe className="h-4 w-4" /> Publish
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatus("draft")}>
                    <EyeOff className="h-4 w-4" /> Unpublish (draft)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatus("archived")}>
                    <Archive className="h-4 w-4" /> Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 bg-transparent"
                disabled={bulkBusy !== null}
                onClick={() => setStockDialogOpen(true)}
              >
                <Package className="h-3.5 w-3.5" />
                Stock
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 bg-transparent"
                    disabled={bulkBusy !== null || !selectionCommonType}
                    title={!selectionCommonType ? "Select products of only one type to assign a category" : undefined}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    Assign category
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {categoryOptionsForSelection.length === 0 ? (
                    <DropdownMenuLabel className="font-normal text-muted-foreground">
                      No categories for this product type yet
                    </DropdownMenuLabel>
                  ) : (
                    <>
                      {categoryOptionsForSelection.map((c) => (
                        <DropdownMenuItem key={c.id} onClick={() => handleBulkCategory(c.id)}>
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkCategory(null)}>Remove category</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 bg-transparent"
                disabled={bulkBusy !== null}
                onClick={handleBulkDuplicate}
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 bg-transparent"
                disabled={bulkBusy !== null}
                onClick={handleExportSelected}
              >
                <Download className="h-3.5 w-3.5" />
                Export selected
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 bg-transparent text-destructive hover:text-destructive border-destructive/30"
                disabled={bulkBusy !== null}
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
            {!selectionCommonType && selectedIds.size > 1 && (
              <p className="text-xs text-muted-foreground mt-2">
                Category assignment is disabled — selected products are of different types.
              </p>
            )}
          </Card>
        )}

        {/* Products */}
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
              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-border">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex items-start gap-3 p-4">
                    <Checkbox
                      className="mt-1 shrink-0"
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={() => toggleSelectOne(product.id)}
                      aria-label={`Select ${product.title}`}
                    />
                    <img
                      src={
                        (product.images && product.images.length > 0 ? product.images[0] : null) ||
                        "/placeholder.svg?height=48&width=48"
                      }
                      alt={product.title}
                      className="w-14 h-14 rounded-lg object-cover ring-1 ring-border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{product.title}</p>
                          <p className="text-xs text-muted-foreground">{product.sku || product.id.slice(0, 8)}</p>
                        </div>
                        <Badge
                          variant={product.status === "published" ? "default" : "secondary"}
                          className={cn(
                            "capitalize shrink-0 text-xs",
                            product.status === "published" && "bg-success/20 text-success-foreground",
                            product.status === "draft" && "bg-muted text-muted-foreground",
                          )}
                        >
                          {product.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={cn("text-xs", getProductTypeBadge(product.product_type).className)}>
                          {getProductTypeBadge(product.product_type).label}
                        </Badge>
                        <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => router.push(`/products/view/${product.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => router.push(`/products/edit/${product.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                          onCheckedChange={toggleSelectAllFiltered}
                          aria-label="Select all products"
                        />
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
                          <Checkbox
                            checked={selectedIds.has(product.id)}
                            onCheckedChange={() => toggleSelectOne(product.id)}
                            aria-label={`Select ${product.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                (product.images && product.images.length > 0 ? product.images[0] : null) ||
                                "/placeholder.svg?height=48&width=48"
                              }
                              alt={product.title}
                              className="w-12 h-12 rounded-lg object-cover ring-2 ring-border group-hover:ring-primary"
                            />
                            <div>
                              <p className="text-xs text-muted-foreground">{product.sku || product.id.slice(0, 8)}</p>
                              <p className="font-medium">{product.title}</p>
                              {product.category && categoryNameById.get(product.category) && (
                                <p className="text-xs text-muted-foreground">{categoryNameById.get(product.category)}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getProductTypeBadge(product.product_type).className}>
                            {getProductTypeBadge(product.product_type).label}
                          </Badge>
                        </TableCell>
                        <TableCell><p className="font-medium">{formatPrice(product.price)}</p></TableCell>
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
                              "capitalize",
                              product.status === "published" && "bg-success/20 text-success-foreground hover:bg-success/30",
                              product.status === "draft" && "bg-muted text-muted-foreground hover:bg-muted/80",
                            )}
                          >
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => router.push(`/products/view/${product.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => router.push(`/products/edit/${product.id}`)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t flex-wrap gap-3">
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
                  <Button size="icon" variant="outline" className="h-8 w-8 bg-transparent" disabled>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8 bg-transparent" disabled>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Bulk: set stock */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set stock for {selectedIds.size} product{selectedIds.size === 1 ? "" : "s"}</DialogTitle>
            <DialogDescription>
              Only applies to physical products without size/colour variants. Digital, event, appointment items
              and variant-managed products will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-stock-qty">Quantity</Label>
            <Input
              id="bulk-stock-qty"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 25"
              value={stockQuantityInput}
              onChange={(e) => setStockQuantityInput(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              disabled={bulkBusy !== null}
              onClick={() => handleBulkStock("out_of_stock")}
            >
              Mark out of stock
            </Button>
            <Button disabled={bulkBusy !== null || stockQuantityInput.trim() === ""} onClick={() => handleBulkStock("set")}>
              {bulkBusy === "stock" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Set quantity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk: delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} product{selectedIds.size === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. Products tied to existing orders can't be deleted and will be skipped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkBusy !== null}
              onClick={(e) => {
                e.preventDefault()
                handleBulkDelete()
              }}
            >
              {bulkBusy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
