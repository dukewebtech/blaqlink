"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil, Trash2, Loader2, Calendar, DollarSign, Tag, Boxes } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
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
  images: string[]
  file_url?: string | null
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

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Fetching product with ID:", productId)

      const response = await fetch(`/api/products/${productId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch product")
      }

      const data = await response.json()
      setProduct(data.product)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product")
      console.error("[v0] Error fetching product:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete product")
      }

      router.push("/products-list")
    } catch (err) {
      console.error("[v0] Error deleting product:", err)
      alert("Failed to delete product")
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getProductTypeBadge = (type: string) => {
    const badges = {
      digital: { label: "Digital Product", className: "bg-blue-500/20 text-blue-700" },
      physical: { label: "Physical Product", className: "bg-green-500/20 text-green-700" },
      event: { label: "Event Ticket", className: "bg-purple-500/20 text-purple-700" },
      appointment: { label: "Appointment", className: "bg-orange-500/20 text-orange-700" },
    }
    return badges[type as keyof typeof badges] || { label: type, className: "" }
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
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              className="gap-2 mb-4 -ml-2 hover:bg-transparent"
              onClick={() => router.push("/products-list")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
              <Badge className={getProductTypeBadge(product.product_type).className}>
                {getProductTypeBadge(product.product_type).label}
              </Badge>
              <Badge variant={product.status === "published" ? "default" : "secondary"} className="capitalize">
                {product.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Product ID: {product.id}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => router.push(`/products/edit/${product.id}`)}
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
            {/* Product Images */}
            {product.images && product.images.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Product Images</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image || "/placeholder.svg"}
                      alt={`${product.title} - ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg ring-2 ring-border"
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* Description */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description || "No description provided"}
              </p>
            </Card>

            {/* Type-specific Details */}
            {product.product_type === "digital" && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Digital Product Details</h2>
                <div className="space-y-3">
                  {product.file_url && (
                    <div>
                      <p className="text-sm text-muted-foreground">File URL</p>
                      <p className="font-medium break-all">{product.file_url}</p>
                    </div>
                  )}
                  {product.file_size && (
                    <div>
                      <p className="text-sm text-muted-foreground">File Size</p>
                      <p className="font-medium">{product.file_size}</p>
                    </div>
                  )}
                  {product.download_limit && (
                    <div>
                      <p className="text-sm text-muted-foreground">Download Limit</p>
                      <p className="font-medium">{product.download_limit} downloads</p>
                    </div>
                  )}
                  {product.license_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">License Type</p>
                      <p className="font-medium capitalize">{product.license_type}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {product.product_type === "event" && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Event Details</h2>
                <div className="space-y-3">
                  {product.event_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Event Date</p>
                      <p className="font-medium">{formatDate(product.event_date)}</p>
                    </div>
                  )}
                  {product.event_location && (
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{product.event_location}</p>
                    </div>
                  )}
                  {product.ticket_types && product.ticket_types.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Ticket Types</p>
                      <div className="space-y-2">
                        {product.ticket_types.map((ticket: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="font-medium">{ticket.name}</span>
                            <span className="text-muted-foreground">{formatPrice(ticket.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {product.product_type === "physical" && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Shipping Details</h2>
                <div className="space-y-3">
                  {product.weight && (
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-medium">{product.weight}</p>
                    </div>
                  )}
                  {product.dimensions && (
                    <div>
                      <p className="text-sm text-muted-foreground">Dimensions</p>
                      <p className="font-medium">{product.dimensions}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Type</p>
                    <p className="font-medium">{product.is_automated_delivery ? "Automated" : "Manual"}</p>
                  </div>
                  {product.shipping_locations && product.shipping_locations.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Shipping Locations</p>
                      <div className="space-y-2">
                        {product.shipping_locations.map((location: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="font-medium">{location.location}</span>
                            <span className="text-muted-foreground">
                              {formatPrice(Number.parseFloat(location.price))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {product.product_type === "appointment" && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Appointment Details</h2>
                <div className="space-y-3">
                  {product.duration && (
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{product.duration} minutes</p>
                    </div>
                  )}
                  {product.booking_buffer && (
                    <div>
                      <p className="text-sm text-muted-foreground">Booking Buffer</p>
                      <p className="font-medium">{product.booking_buffer} minutes</p>
                    </div>
                  )}
                  {product.available_slots && product.available_slots.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Available Time Slots</p>
                      <div className="grid grid-cols-2 gap-2">
                        {product.available_slots.map((slot: any, index: number) => (
                          <div key={index} className="p-3 bg-muted rounded-lg text-center">
                            <p className="font-medium">{slot.day}</p>
                            <p className="text-sm text-muted-foreground">
                              {slot.start} - {slot.end}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Pricing</h2>
              </div>
              <p className="text-3xl font-bold">{formatPrice(product.price)}</p>
            </Card>

            {/* Inventory */}
            {(product.product_type === "physical" || product.product_type === "event") && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Boxes className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Inventory</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Stock Quantity</p>
                    <p className="text-2xl font-bold">{product.stock_quantity || 0}</p>
                  </div>
                  {product.sku && (
                    <div>
                      <p className="text-sm text-muted-foreground">SKU</p>
                      <p className="font-medium">{product.sku}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Category */}
            {product.category && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Category</h2>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {product.category}
                </Badge>
              </Card>
            )}

            {/* Metadata */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Metadata</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(product.created_at)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
