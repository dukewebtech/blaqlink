"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  X,
  Loader2,
} from "lucide-react"

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

const productTypeColors = {
  digital: "bg-green-100 text-green-700 border-green-200",
  physical: "bg-yellow-100 text-yellow-700 border-yellow-200",
  event: "bg-yellow-100 text-yellow-700 border-yellow-200",
  appointment: "bg-green-100 text-green-700 border-green-200",
}

const productTypeLabels = {
  digital: "Digital Product",
  physical: "Physical Product",
  event: "Tickets",
  appointment: "Appointments",
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [categoryImage, setCategoryImage] = useState<string>("")

  const [newCategory, setNewCategory] = useState({
    name: "",
    product_type: "digital",
    description: "",
    status: "active",
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    filterCategories()
  }, [categories, searchQuery, selectedType])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/categories")
      const data = await response.json()

      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("[v0] Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterCategories = () => {
    let filtered = categories

    if (selectedType !== "all") {
      filtered = filtered.filter((cat) => cat.product_type === selectedType)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredCategories(filtered)
  }

  const handleCreateCategory = async () => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCategory,
          image_url: categoryImage || null,
        }),
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        setNewCategory({ name: "", product_type: "digital", description: "", status: "active" })
        setCategoryImage("")
        fetchCategories()
      }
    } catch (error) {
      console.error("[v0] Error creating category:", error)
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      const response = await fetch(`/api/categories/${categoryToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setIsDeleteDialogOpen(false)
        setCategoryToDelete(null)
        fetchCategories()
      }
    } catch (error) {
      console.error("[v0] Error deleting category:", error)
    }
  }

  const toggleCategorySelection = (id: string) => {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]))
  }

  const toggleAllCategories = () => {
    if (selectedCategories.length === filteredCategories.length && filteredCategories.length > 0) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(filteredCategories.map((cat) => cat.id))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      setCategoryImage(data.url)
      console.log("[v0] Category image uploaded:", data.url)
    } catch (error) {
      console.error("[v0] Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setCategoryImage("")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Dashboard</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for id, name product"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          </div>
        </div>

        <div className="flex gap-2 border-b overflow-x-auto">
          <Button
            variant={selectedType === "all" ? "default" : "ghost"}
            onClick={() => setSelectedType("all")}
            className="rounded-b-none whitespace-nowrap"
          >
            All Categories
          </Button>
          <Button
            variant={selectedType === "digital" ? "default" : "ghost"}
            onClick={() => setSelectedType("digital")}
            className="rounded-b-none whitespace-nowrap"
          >
            Digital Product
          </Button>
          <Button
            variant={selectedType === "physical" ? "default" : "ghost"}
            onClick={() => setSelectedType("physical")}
            className="rounded-b-none whitespace-nowrap"
          >
            Physical Product
          </Button>
          <Button
            variant={selectedType === "appointment" ? "default" : "ghost"}
            onClick={() => setSelectedType("appointment")}
            className="rounded-b-none whitespace-nowrap"
          >
            Appointments
          </Button>
          <Button
            variant={selectedType === "event" ? "default" : "ghost"}
            onClick={() => setSelectedType("event")}
            className="rounded-b-none whitespace-nowrap"
          >
            Event Tickets
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                    onCheckedChange={toggleAllCategories}
                  />
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Linked Products</TableHead>
                <TableHead>Product Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No categories found. Create your first category!
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => toggleCategorySelection(category.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {category.image_url ? (
                            <img
                              src={category.image_url || "/placeholder.svg"}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">No img</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">{category.description || "No description"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{category.products?.[0]?.count || 0}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={productTypeColors[category.product_type as keyof typeof productTypeColors]}
                      >
                        {productTypeLabels[category.product_type as keyof typeof productTypeLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/categories/${category.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/categories/edit/${category.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCategoryToDelete(category.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            1 - {filteredCategories.length} of {categories.length} Pages
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">The page on</span>
            <Select defaultValue="1">
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>Add a new category to organize your products.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Image (Optional)</Label>
              <div className="flex items-start gap-4">
                {categoryImage ? (
                  <div className="relative w-32 h-32 rounded-lg border overflow-hidden group">
                    <img
                      src={categoryImage || "/placeholder.svg"}
                      alt="Category"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground text-center px-2">Click to upload</span>
                      </>
                    )}
                  </label>
                )}
                <div className="flex-1 text-sm text-muted-foreground">
                  <p>Upload a category image to make it more recognizable.</p>
                  <p className="mt-1">Recommended: Square image, max 5MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_type">Product Type</Label>
              <Select
                value={newCategory.product_type}
                onValueChange={(value) => setNewCategory({ ...newCategory, product_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital Product</SelectItem>
                  <SelectItem value="physical">Physical Product</SelectItem>
                  <SelectItem value="event">Event Tickets</SelectItem>
                  <SelectItem value="appointment">Appointments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Enter category description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={!newCategory.name}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
