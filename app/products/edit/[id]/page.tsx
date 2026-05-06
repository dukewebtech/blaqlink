"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Loader2, Upload, X, FileText, Plus, Trash2, ImagePlus } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

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
  ticket_types?: { name: string; price: string }[] | null
  is_paid_ticket?: boolean | null
  total_capacity?: number | null
  weight?: string | null
  dimensions?: string | null
  is_automated_delivery?: boolean | null
  shipping_locations?: { location: string; price: string }[] | null
  logistics_api_key?: string | null
  duration_minutes?: number | null
  available_days?: string[] | null
  start_time?: string | null
  end_time?: string | null
  booking_link?: string | null
}

type Category = {
  id: string
  name: string
  product_type: string
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
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(0)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [categories, setCategories] = useState<Array<Category>>([])

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({})

  const [ticketTypes, setTicketTypes] = useState<{ name: string; price: string }[]>([{ name: "Regular", price: "" }])
  const [isPaidTicket, setIsPaidTicket] = useState(true)

  const [shippingLocations, setShippingLocations] = useState<{ location: string; price: string }[]>([
    { location: "", price: "" },
  ])
  const [isAutomatedDelivery, setIsAutomatedDelivery] = useState(false)

  const [availableDays, setAvailableDays] = useState<string[]>([])

  useEffect(() => {
    if (params.id) {
      fetchProduct()
      fetchCategories()
    }
  }, [params.id])

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

      if (data.product.ticket_types && data.product.ticket_types.length > 0) {
        setTicketTypes(data.product.ticket_types)
      }
      if (data.product.is_paid_ticket !== null) {
        setIsPaidTicket(data.product.is_paid_ticket)
      }
      if (data.product.shipping_locations && data.product.shipping_locations.length > 0) {
        setShippingLocations(data.product.shipping_locations)
      }
      if (data.product.is_automated_delivery !== null) {
        setIsAutomatedDelivery(data.product.is_automated_delivery)
      }
      if (data.product.available_days && data.product.available_days.length > 0) {
        setAvailableDays(data.product.available_days)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product")
      console.error("[v0] Error fetching product:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("[v0] Error fetching categories:", error)
    }
  }

  const handleImageUpload = async (index: number) => {
    setCurrentUploadIndex(index)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingIndex(currentUploadIndex)

      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()

      setFormData((prev) => {
        const newImages = [...(prev.images || [])]
        newImages[currentUploadIndex] = data.url
        return { ...prev, images: newImages }
      })
    } catch (err) {
      console.error("[v0] Error uploading image:", err)
      alert("Failed to upload image")
    } finally {
      setUploadingIndex(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
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
    setFormData((prev) => {
      const newImages = [...(prev.images || [])]
      newImages[index] = ""
      return { ...prev, images: newImages }
    })
  }

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: "", price: "" }])
  }

  const removeTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index))
  }

  const addShippingLocation = () => {
    setShippingLocations([...shippingLocations, { location: "", price: "" }])
  }

  const removeShippingLocation = (index: number) => {
    setShippingLocations(shippingLocations.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const submitData: any = { ...formData }

      if (product?.product_type === "event") {
        submitData.ticket_types = ticketTypes.filter((t) => t.name)
        submitData.is_paid_ticket = isPaidTicket
      }

      if (product?.product_type === "physical") {
        submitData.shipping_locations = !isAutomatedDelivery ? shippingLocations.filter((l) => l.location) : null
        submitData.is_automated_delivery = isAutomatedDelivery
      }

      if (product?.product_type === "appointment") {
        submitData.available_days = availableDays
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
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
      const cleanName = decodeURIComponent(fileName.split("?")[0])
      // Remove timestamp prefix if present
      const nameMatch = cleanName.match(/^\d+-(.+)$/)
      return nameMatch ? nameMatch[1] : cleanName
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
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          <p className="text-muted-foreground mt-2">
            Update your{" "}
            {product.product_type === "event"
              ? "event"
              : product.product_type === "appointment"
                ? "appointment"
                : product.product_type === "digital"
                  ? "digital product"
                  : "physical product"}{" "}
            details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <Card className="lg:col-span-2 p-6 space-y-6">
            <h2 className="text-lg font-semibold">Product Information</h2>

            {/* Basic Fields - All product types */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">
                  {product.product_type === "appointment"
                    ? "Service Name"
                    : product.product_type === "event"
                      ? "Event Title"
                      : "Product Title"}{" "}
                  *
                </Label>
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

              {/* Digital Product Fields */}
              {product.product_type === "digital" && (
                <>
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
                      <Select
                        value={formData.category || ""}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((cat) => cat.product_type === formData.product_type)
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>License Type</Label>
                      <p className="text-xs text-muted-foreground">
                        {formData.license_type === "extended" ? "Extended License" : "Standard License"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Standard</span>
                      <Switch
                        checked={formData.license_type === "extended"}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, license_type: checked ? "extended" : "standard" })
                        }
                      />
                      <span className="text-sm">Extended</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="download_limit">Download Limit (Optional)</Label>
                    <Input
                      id="download_limit"
                      type="number"
                      min="1"
                      value={formData.download_limit || ""}
                      onChange={(e) => setFormData({ ...formData, download_limit: Number.parseInt(e.target.value) })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </>
              )}

              {/* Event Fields */}
              {product.product_type === "event" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event_date">Event Date & Time *</Label>
                      <Input
                        id="event_date"
                        type="datetime-local"
                        value={formData.event_date ? formData.event_date.slice(0, 16) : ""}
                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="event_location">Event Location *</Label>
                      <Input
                        id="event_location"
                        value={formData.event_location || ""}
                        onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                        placeholder="Enter location or address"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Ticket Type</Label>
                      <p className="text-xs text-muted-foreground">{isPaidTicket ? "Paid Event" : "Free Event"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Free</span>
                      <Switch checked={isPaidTicket} onCheckedChange={setIsPaidTicket} />
                      <span className="text-sm">Paid</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Ticket Types</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTicketType}
                        className="gap-2 bg-transparent"
                      >
                        <Plus className="h-4 w-4" />
                        Add Ticket Type
                      </Button>
                    </div>
                    {ticketTypes.map((ticket, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Ticket name (e.g., VIP, Regular)"
                          value={ticket.name}
                          onChange={(e) => {
                            const newTickets = [...ticketTypes]
                            newTickets[index].name = e.target.value
                            setTicketTypes(newTickets)
                          }}
                        />
                        {isPaidTicket && (
                          <Input
                            placeholder="Price"
                            type="number"
                            step="0.01"
                            value={ticket.price}
                            onChange={(e) => {
                              const newTickets = [...ticketTypes]
                              newTickets[index].price = e.target.value
                              setTicketTypes(newTickets)
                            }}
                          />
                        )}
                        {ticketTypes.length > 1 && (
                          <Button type="button" variant="outline" size="icon" onClick={() => removeTicketType(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label htmlFor="total_capacity">Ticket Quantity / Capacity</Label>
                    <Input
                      id="total_capacity"
                      type="number"
                      value={formData.total_capacity || ""}
                      onChange={(e) => setFormData({ ...formData, total_capacity: Number.parseInt(e.target.value) })}
                      placeholder="Enter total capacity"
                    />
                  </div>
                </>
              )}

              {/* Physical Product Fields */}
              {product.product_type === "physical" && (
                <>
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
                      <Select
                        value={formData.category || ""}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((cat) => cat.product_type === formData.product_type)
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock_quantity">Stock Quantity</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity || ""}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU / Product Code</Label>
                      <Input
                        id="sku"
                        value={formData.sku || ""}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status || "published"}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Available</SelectItem>
                        <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                        <SelectItem value="coming-soon">Coming Soon</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Shipping Options</Label>
                        <p className="text-xs text-muted-foreground">
                          {isAutomatedDelivery ? "Automated delivery via API" : "Manual location pricing"}
                        </p>
                      </div>
                      <Switch checked={isAutomatedDelivery} onCheckedChange={setIsAutomatedDelivery} />
                    </div>

                    {isAutomatedDelivery ? (
                      <div>
                        <Label htmlFor="logistics_api_key">Logistics Provider API Key</Label>
                        <Input
                          id="logistics_api_key"
                          type="password"
                          value={formData.logistics_api_key || ""}
                          onChange={(e) => setFormData({ ...formData, logistics_api_key: e.target.value })}
                          placeholder="Enter your API key"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Manual Delivery Pricing</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addShippingLocation}
                            className="gap-2 bg-transparent"
                          >
                            <Plus className="h-4 w-4" />
                            Add Location
                          </Button>
                        </div>
                        {shippingLocations.map((location, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder="Location (e.g., Lagos)"
                              value={location.location}
                              onChange={(e) => {
                                const newLocations = [...shippingLocations]
                                newLocations[index].location = e.target.value
                                setShippingLocations(newLocations)
                              }}
                            />
                            <Input
                              placeholder="Price"
                              type="number"
                              step="0.01"
                              value={location.price}
                              onChange={(e) => {
                                const newLocations = [...shippingLocations]
                                newLocations[index].price = e.target.value
                                setShippingLocations(newLocations)
                              }}
                            />
                            {shippingLocations.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeShippingLocation(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Appointment Fields */}
              {product.product_type === "appointment" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration_minutes">Appointment Duration</Label>
                      <Select
                        value={formData.duration_minutes?.toString() || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, duration_minutes: Number.parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="price">Price per Session *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price || ""}
                        onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Available Days</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                        <Button
                          key={day}
                          type="button"
                          variant={availableDays.includes(day) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setAvailableDays((prev) =>
                              prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
                            )
                          }}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time || ""}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time || ""}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="booking_link">Booking Link / Integration (Optional)</Label>
                    <Input
                      id="booking_link"
                      value={formData.booking_link || ""}
                      onChange={(e) => setFormData({ ...formData, booking_link: e.target.value })}
                      placeholder="Enter booking link or calendar integration"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Digital Files Section */}
            {product.product_type === "digital" && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Digital Files</h3>
                <p className="text-sm text-muted-foreground">
                  Upload the files that customers will receive after purchase.
                </p>

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
              </div>
            )}
          </Card>

          {/* Image Upload Sidebar */}
          <Card className="p-6 space-y-6 h-fit">
            <div>
              <h2 className="text-lg font-semibold">
                {product.product_type === "event"
                  ? "Event Banner"
                  : product.product_type === "appointment"
                    ? "Service Image"
                    : "Product Images"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Format: SVG, PNG, or JPG (Max 4MB)</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleImageUpload(index)}
                    disabled={uploadingIndex === index}
                    className={cn(
                      "aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:border-primary hover:bg-primary/5 w-full",
                      formData.images?.[index] ? "border-primary bg-primary/5" : "border-border",
                      uploadingIndex === index && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {uploadingIndex === index ? (
                      <>
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <span className="text-xs text-muted-foreground">Uploading...</span>
                      </>
                    ) : formData.images?.[index] ? (
                      <img
                        src={formData.images[index] || "/placeholder.svg"}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Photo {index + 1}</span>
                      </>
                    )}
                  </button>
                  {formData.images?.[index] && uploadingIndex !== index && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveImage(index)
                      }}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/products/view/${productId}`)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
