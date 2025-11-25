"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Loader2, Upload, X, FileText } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"

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
  images: string[]
  file_urls?: string[]
  file_size?: string | null
  download_limit?: number | null
  license_type?: string | null
  event_date?: string | null
  event_location?: string | null
  ticket_types?: any[] | null
  weight?: string | null
  dimensions?: string | null
  is_automated_delivery?: boolean | null
  shipping_locations?: any[] | null
  logistics_api_key?: string | null
  duration?: number | null
  available_slots?: any[] | null
  booking_buffer?: number | null
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const digitalFileInputRef = useRef<HTMLInputElement>(null)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingDigitalFile, setUploadingDigitalFile] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({})

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/products/${productId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch product")
      }

      const data = await response.json()
      setProduct(data.product)
      setFormData(data.product)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product")
      console.error("[v0] Error fetching product:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), data.url],
      }))
    } catch (err) {
      console.error("[v0] Error uploading image:", err)
      alert("Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDigitalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setUploadingDigitalFile(true)

      for (const file of Array.from(files)) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)

        const response = await fetch("/api/upload-digital", {
          method: "POST",
          body: uploadFormData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to upload file")
        }

        const data = await response.json()

        setFormData((prev) => ({
          ...prev,
          file_urls: [...(prev.file_urls || []), data.url],
        }))
      }
    } catch (err) {
      console.error("[v0] Error uploading digital file:", err)
      alert(err instanceof Error ? err.message : "Failed to upload file")
    } finally {
      setUploadingDigitalFile(false)
      if (digitalFileInputRef.current) {
        digitalFileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveDigitalFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      file_urls: prev.file_urls?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update product")
      }

      router.push(`/products/view/${productId}`)
    } catch (err) {
      console.error("[v0] Error updating product:", err)
      alert("Failed to update product")
    } finally {
      setSaving(false)
    }
  }

  const getFileName = (url: string) => {
    try {
      const urlParts = url.split("/")
      const fileName = urlParts[urlParts.length - 1]
      return decodeURIComponent(fileName.split("?")[0])
    } catch {
      return "File"
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading product...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !product) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-destructive mb-4">{error || "Product not found"}</p>
          <Button onClick={() => router.push("/products-list")}>Back to Products</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            className="gap-2 mb-4 -ml-2 hover:bg-transparent"
            onClick={() => router.push(`/products/view/${productId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Product
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground mt-2">Update your product details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category || ""}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || "draft"}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Product Images */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Product Images</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {formData.images?.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg ring-2 ring-border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-2">Add Image</span>
                    </>
                  )}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </Card>

          {product.product_type === "digital" && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Digital Files</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Upload the files that customers will receive after purchase.
              </p>
              <div className="space-y-4">
                {/* Uploaded files list */}
                {formData.file_urls && formData.file_urls.length > 0 && (
                  <div className="space-y-2">
                    {formData.file_urls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium truncate max-w-[300px]">{getFileName(url)}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDigitalFile(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => digitalFileInputRef.current?.click()}
                  disabled={uploadingDigitalFile}
                  className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  {uploadingDigitalFile ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground mt-2">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground mt-2">Click to upload digital files</span>
                      <span className="text-xs text-muted-foreground">PDF, ZIP, MP4, MP3, EPUB, DOC (max 100MB)</span>
                    </>
                  )}
                </button>
                <input
                  ref={digitalFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.zip,.mp4,.mov,.avi,.mp3,.epub,.doc,.docx"
                  onChange={handleDigitalFileChange}
                  className="hidden"
                />

                {/* License and download settings */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="license_type">License Type</Label>
                    <Select
                      value={formData.license_type || "standard"}
                      onValueChange={(value) => setFormData({ ...formData, license_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard License</SelectItem>
                        <SelectItem value="extended">Extended License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="download_limit">Download Limit</Label>
                    <Input
                      id="download_limit"
                      type="number"
                      min="1"
                      value={formData.download_limit || ""}
                      onChange={(e) => setFormData({ ...formData, download_limit: Number.parseInt(e.target.value) })}
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Type-specific fields */}
          {product.product_type === "physical" && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Inventory & Shipping</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku || ""}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock_quantity || ""}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push(`/products/view/${productId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
