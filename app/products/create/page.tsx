"use client"

import type React from "react"
import { useState, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ImagePlus, ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"

type ProductType = "digital" | "event" | "physical" | "appointment"

export default function CreateProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productType = (searchParams.get("type") as ProductType) || "physical"

  const [images, setImages] = useState<string[]>([])
  const [isAutomatedDelivery, setIsAutomatedDelivery] = useState(false)
  const [isPaidTicket, setIsPaidTicket] = useState(true)
  const [licenseType, setLicenseType] = useState<"standard" | "extended">("standard")
  const [ticketTypes, setTicketTypes] = useState([{ name: "Regular", price: "" }])
  const [shippingLocations, setShippingLocations] = useState([{ location: "", price: "" }])
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(0)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    sku: "",
    stockQuantity: "",
    status: "available",
    apiKey: "",
    eventDate: "",
    eventLocation: "",
    capacity: "",
    serviceName: "",
    duration: "",
    pricePerSession: "",
    startTime: "",
    endTime: "",
    bookingLink: "",
    downloadLimit: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      console.log("[v0] Submitting product creation form...")

      // Prepare product data based on type
      const productData: any = {
        product_type: productType,
        title: formData.title || formData.serviceName,
        description: formData.description,
        price: formData.price ? Number.parseFloat(formData.price) : null,
        category: formData.category,
        status: "published",
        images: images.filter(Boolean),
      }

      // Add type-specific fields
      if (productType === "digital") {
        productData.license_type = licenseType
        productData.download_limit = formData.downloadLimit ? Number.parseInt(formData.downloadLimit) : null
      } else if (productType === "event") {
        productData.event_date = formData.eventDate
        productData.event_location = formData.eventLocation
        productData.is_paid_ticket = isPaidTicket
        productData.ticket_types = ticketTypes.filter((t) => t.name)
        productData.total_capacity = formData.capacity ? Number.parseInt(formData.capacity) : null
      } else if (productType === "physical") {
        productData.sku = formData.sku
        productData.stock_quantity = formData.stockQuantity ? Number.parseInt(formData.stockQuantity) : null
        productData.is_automated_delivery = isAutomatedDelivery
        productData.logistics_api_key = isAutomatedDelivery ? formData.apiKey : null
        productData.shipping_locations = !isAutomatedDelivery ? shippingLocations.filter((l) => l.location) : null
      } else if (productType === "appointment") {
        productData.duration_minutes = formData.duration ? Number.parseInt(formData.duration) : null
        productData.available_days = availableDays
        productData.start_time = formData.startTime
        productData.end_time = formData.endTime
        productData.booking_link = formData.bookingLink
        productData.price = formData.pricePerSession ? Number.parseFloat(formData.pricePerSession) : null
      }

      console.log("[v0] Product data:", productData)

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create product")
      }

      console.log("[v0] Product created successfully:", result.product)
      router.push("/products/success")
    } catch (err: any) {
      console.error("[v0] Error creating product:", err)
      setError(err.message || "Failed to create product. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
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

  const getProductTypeTitle = () => {
    switch (productType) {
      case "digital":
        return "Digital Product"
      case "event":
        return "Event Ticket"
      case "physical":
        return "Physical Product"
      case "appointment":
        return "Paid Appointment"
      default:
        return "Product"
    }
  }

  const handleImageUpload = async (index: number) => {
    setCurrentUploadIndex(index)
    setUploadError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingIndex(currentUploadIndex)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload image")
      }

      // Update images array with the uploaded image URL
      setImages((prev) => {
        const newImages = [...prev]
        newImages[currentUploadIndex] = result.url
        return newImages
      })

      console.log("[v0] Image uploaded successfully:", result.url)
    } catch (err: any) {
      console.error("[v0] Upload error:", err)
      setUploadError(err.message || "Failed to upload image")
    } finally {
      setUploadingIndex(null)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      newImages[index] = ""
      return newImages
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Dashboard</span>
            <span>›</span>
            <span>Product</span>
            <span>›</span>
            <span className="text-primary font-medium">{getProductTypeTitle()}</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Product</h1>
            <Button
              variant="outline"
              onClick={() => router.push("/products/choose-type")}
              className="gap-2 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Categories
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm">
            Choose a product type
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium text-sm">
            Add Product
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm">
            Preview and Publish
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {uploadError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm animate-in fade-in slide-in-from-top-2">
            {uploadError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8" key={productType}>
          {/* Product Information */}
          <Card className="lg:col-span-2 p-8 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
            <div>
              <h2 className="text-xl font-bold">Product Information</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {productType === "digital" && "Add details about your digital product"}
                {productType === "event" && "Set up your event details and ticketing"}
                {productType === "physical" && "Add details about your physical product"}
                {productType === "appointment" && "Configure your appointment service"}
              </p>
            </div>

            <div className="space-y-4">
              {productType === "digital" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">Product Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter product title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      required
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Short Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your digital product"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="files">File Upload</Label>
                    <Input
                      id="files"
                      type="file"
                      multiple
                      accept=".pdf,.zip,.mp4,.mov,.avi"
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                    <p className="text-xs text-muted-foreground">Supported: PDF, ZIP, MP4, MOV, AVI</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        placeholder="Enter price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        required
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger className="transition-all duration-200 focus:scale-[1.01]">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ebooks">E-books</SelectItem>
                          <SelectItem value="courses">Courses</SelectItem>
                          <SelectItem value="templates">Templates</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>License Type</Label>
                      <p className="text-xs text-muted-foreground">
                        {licenseType === "standard" ? "Standard License" : "Extended License"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Standard</span>
                      <Switch
                        checked={licenseType === "extended"}
                        onCheckedChange={(checked) => setLicenseType(checked ? "extended" : "standard")}
                      />
                      <span className="text-sm">Extended</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="downloadLimit">Download Limit (Optional)</Label>
                    <Input
                      id="downloadLimit"
                      placeholder="Leave empty for unlimited"
                      type="number"
                      value={formData.downloadLimit}
                      onChange={(e) => handleInputChange("downloadLimit", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>
                </>
              )}

              {productType === "event" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="eventTitle">Event Title</Label>
                    <Input
                      id="eventTitle"
                      placeholder="Enter event title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      required
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventDescription">Event Description</Label>
                    <Textarea
                      id="eventDescription"
                      placeholder="Describe your event"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Event Date & Time</Label>
                      <Input
                        id="eventDate"
                        type="datetime-local"
                        value={formData.eventDate}
                        onChange={(e) => handleInputChange("eventDate", e.target.value)}
                        required
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eventLocation">Event Location</Label>
                      <Input
                        id="eventLocation"
                        placeholder="Enter location or address"
                        value={formData.eventLocation}
                        onChange={(e) => handleInputChange("eventLocation", e.target.value)}
                        required
                        className="transition-all duration-200 focus:scale-[1.01]"
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
                          className="transition-all duration-200 focus:scale-[1.01]"
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
                            className="transition-all duration-200 focus:scale-[1.01]"
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

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Ticket Quantity / Capacity</Label>
                    <Input
                      id="capacity"
                      placeholder="Enter total capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange("capacity", e.target.value)}
                      required
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>
                </>
              )}

              {productType === "physical" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      placeholder="Input product name"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      required
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productDescription">Product Description</Label>
                    <Textarea
                      id="productDescription"
                      placeholder="Describe your product"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Product Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger className="transition-all duration-200 focus:scale-[1.01]">
                          <SelectValue placeholder="Select product category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sneakers">Sneakers</SelectItem>
                          <SelectItem value="jacket">Jacket</SelectItem>
                          <SelectItem value="tshirt">T-Shirt</SelectItem>
                          <SelectItem value="bag">Bag</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        placeholder="Input Price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        required
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Stock Quantity</Label>
                      <Input
                        id="quantity"
                        placeholder="Input stock"
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => handleInputChange("stockQuantity", e.target.value)}
                        required
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU / Product Code</Label>
                      <Input
                        id="sku"
                        placeholder="Enter SKU"
                        value={formData.sku}
                        onChange={(e) => handleInputChange("sku", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status Product</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger className="transition-all duration-200 focus:scale-[1.01]">
                        <SelectValue placeholder="Select status product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                        <SelectItem value="coming-soon">Coming Soon</SelectItem>
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
                      <div className="space-y-2">
                        <Label htmlFor="apiKey">Logistics Provider API Key</Label>
                        <Input
                          id="apiKey"
                          placeholder="Enter your API key"
                          type="password"
                          value={formData.apiKey}
                          onChange={(e) => handleInputChange("apiKey", e.target.value)}
                          className="transition-all duration-200 focus:scale-[1.01]"
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
                              className="transition-all duration-200 focus:scale-[1.01]"
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
                              className="transition-all duration-200 focus:scale-[1.01]"
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

              {productType === "appointment" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="serviceName">Service Name</Label>
                    <Input
                      id="serviceName"
                      placeholder="Enter service name"
                      value={formData.serviceName}
                      onChange={(e) => handleInputChange("serviceName", e.target.value)}
                      required
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceDescription">Service Description</Label>
                    <Textarea
                      id="serviceDescription"
                      placeholder="Describe your service"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Appointment Duration</Label>
                      <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
                        <SelectTrigger className="transition-all duration-200 focus:scale-[1.01]">
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

                    <div className="space-y-2">
                      <Label htmlFor="pricePerSession">Price per Session</Label>
                      <Input
                        id="pricePerSession"
                        placeholder="Enter price"
                        type="number"
                        step="0.01"
                        value={formData.pricePerSession}
                        onChange={(e) => handleInputChange("pricePerSession", e.target.value)}
                        required
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Available Days</Label>
                    <div className="grid grid-cols-4 gap-2">
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
                          className="transition-all duration-200"
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                        required
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange("endTime", e.target.value)}
                        required
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bookingLink">Booking Link / Integration (Optional)</Label>
                    <Input
                      id="bookingLink"
                      placeholder="Enter booking link or calendar integration"
                      value={formData.bookingLink}
                      onChange={(e) => handleInputChange("bookingLink", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Image Upload */}
          <Card className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
            <div>
              <h2 className="text-xl font-bold">
                {productType === "event"
                  ? "Event Banner"
                  : productType === "appointment"
                    ? "Service Image"
                    : "Image Product"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Note :</span> Format photos SVG, PNG, or JPG (Max size 4mb)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleImageUpload(index - 1)}
                    disabled={uploadingIndex === index - 1}
                    className={cn(
                      "aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:scale-105 w-full",
                      images[index - 1] ? "border-primary bg-primary/5" : "border-border",
                      uploadingIndex === index - 1 && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {uploadingIndex === index - 1 ? (
                      <>
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <span className="text-xs text-muted-foreground">Uploading...</span>
                      </>
                    ) : images[index - 1] ? (
                      <img
                        src={images[index - 1] || "/placeholder.svg"}
                        alt={`Product ${index}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Photo {index}</span>
                      </>
                    )}
                  </button>
                  {images[index - 1] && uploadingIndex !== index - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(index - 1)
                      }}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  {productType === "event"
                    ? "Publish Event"
                    : productType === "appointment"
                      ? "Save Service"
                      : "Save Product"}
                </>
              )}
            </Button>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
