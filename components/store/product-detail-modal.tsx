"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, X, Download, FileText, Shield, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cartStore } from "@/lib/cart-store"

interface Product {
  id: string
  title: string
  price: number
  images: string[]
  product_type: string
  category: string
  description: string
  stock_quantity?: number
  event_date?: string
  event_location?: string
  is_paid_ticket?: boolean
  ticket_types?: Array<{ name: string; price: string }>
  total_capacity?: number
  duration_minutes?: number
  available_days?: string[]
  start_time?: string
  end_time?: string
  booking_link?: string
  file_urls?: string[]
  license_type?: string
  download_limit?: number
  shipping_locations?: Array<{ location: string; price: string }>
  is_automated_delivery?: boolean
}

interface ProductDetailModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  storeName?: string
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  storeName = "Store Owner",
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedTicketType, setSelectedTicketType] = useState<{ name: string; price: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    setCurrentImageIndex(0)
    setQuantity(1)
    setSelectedDate(null)
    setSelectedTimeSlot("")
    setCurrentMonth(new Date())
    if (product?.product_type === "event" && product.ticket_types && product.ticket_types.length > 0) {
      setSelectedTicketType(product.ticket_types[0])
    } else {
      setSelectedTicketType(null)
    }
  }, [product?.id])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [open, onOpenChange])

  if (!product || !open) return null

  const isEventTicket = product.product_type === "event"
  const isAppointment = product.product_type === "appointment"
  const isDigitalProduct = product.product_type === "digital"
  const hasMultipleImages = product?.images && product.images.length > 1

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  const handleAddToCart = () => {
    const metadata =
      isAppointment && selectedDate && selectedTimeSlot
        ? { appointment_date: selectedDate.toISOString(), appointment_time: selectedTimeSlot }
        : selectedTicketType
          ? { ticket_type: selectedTicketType.name }
          : undefined

    cartStore.addItem(
      {
        id: product.id,
        title: product.title,
        price: isEventTicket && selectedTicketType ? Number.parseFloat(selectedTicketType.price) : product.price,
        product_type: product.product_type,
        images: product.images,
      },
      quantity,
      metadata,
    )
    onOpenChange(false)
  }

  if (isDigitalProduct) {
    const fileCount = product.file_urls?.length || 0
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="relative bg-gray-100">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[currentImageIndex] || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover min-h-[400px]"
                />
              ) : (
                <div className="flex h-[400px] items-center justify-center">
                  <Download className="h-12 w-12 text-purple-600" />
                </div>
              )}
            </div>
            <div className="p-8 space-y-6">
              <div>
                {product.category && (
                  <Badge variant="secondary" className="mb-2">
                    {product.category}
                  </Badge>
                )}
                <h2 className="text-3xl font-bold">{product.title}</h2>
                <p className="text-sm text-gray-500 mt-2">By {storeName}</p>
              </div>
              <div className="border rounded-lg p-4 space-y-3 bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-purple-600" />
                  <Badge className="bg-purple-600">Instant Download</Badge>
                </div>
                {product.license_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium capitalize">{product.license_type} License</p>
                      <p className="text-xs text-gray-600">
                        {product.license_type === "extended" ? "Commercial use" : "Personal use"}
                      </p>
                    </div>
                  </div>
                )}
                {fileCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <p className="font-medium">{fileCount} Files Included</p>
                  </div>
                )}
              </div>
              {product.description && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{product.description}</p>
                </div>
              )}
              <div className="border-t pt-6 space-y-4">
                <span className="text-3xl font-bold">${Number(product.price).toFixed(2)}</span>
                <Button onClick={handleAddToCart} className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700">
                  Purchase & Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isEventTicket) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative bg-gray-100 min-h-[300px] flex items-center justify-center">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <Calendar className="h-24 w-24 text-gray-400" />
            )}
          </div>
          <div className="p-8 space-y-6">
            <div>
              {product.category && (
                <Badge variant="secondary" className="mb-2">
                  {product.category}
                </Badge>
              )}
              <h2 className="text-3xl font-bold">{product.title}</h2>
              <p className="text-sm text-gray-500 mt-2">By {storeName}</p>
            </div>
            {product.description && <p className="text-sm text-gray-600">{product.description}</p>}
            {product.ticket_types && (
              <div className="space-y-4">
                <label className="text-sm font-semibold">Select Ticket Type</label>
                {product.ticket_types.map((ticket, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTicketType(ticket)}
                    className={`w-full p-4 border rounded-lg text-left ${selectedTicketType?.name === ticket.name ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{ticket.name}</span>
                      <span className="font-bold">${Number.parseFloat(ticket.price).toFixed(2)}</span>
                    </div>
                  </button>
                ))}
                <div>
                  <label className="text-sm font-semibold block mb-2">Quantity</label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                      -
                    </Button>
                    <span className="text-xl w-12 text-center">{quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => setQuantity((q) => q + 1)}>
                      +
                    </Button>
                  </div>
                </div>
                <Button onClick={handleAddToCart} disabled={!selectedTicketType} className="w-full h-12 text-lg">
                  Get Tickets
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isAppointment) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="p-8 space-y-6">
            <div>
              {product.category && (
                <Badge variant="secondary" className="mb-2">
                  {product.category}
                </Badge>
              )}
              <h2 className="text-3xl font-bold">{product.title}</h2>
              <p className="text-sm text-gray-500 mt-2">By {storeName}</p>
            </div>
            {product.description && <p className="text-sm text-gray-600">{product.description}</p>}
            <div className="border-t pt-6">
              <span className="text-3xl font-bold">${Number(product.price).toFixed(2)}</span>
              <Button
                onClick={handleAddToCart}
                disabled={!selectedDate || !selectedTimeSlot}
                className="w-full h-12 text-lg mt-4"
              >
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="relative bg-gray-100 min-h-[300px]">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[currentImageIndex] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">No Image</div>
            )}
          </div>
          <div className="p-8 space-y-6">
            <div>
              {product.category && (
                <Badge variant="secondary" className="mb-2">
                  {product.category}
                </Badge>
              )}
              <h2 className="text-3xl font-bold">{product.title}</h2>
              <p className="text-sm text-gray-500 mt-2">By {storeName}</p>
            </div>
            {product.description && <p className="text-sm text-gray-600">{product.description}</p>}
            {product.stock_quantity !== undefined && (
              <div className="text-sm">
                <span className={`font-medium ${product.stock_quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                </span>
              </div>
            )}
            {product.shipping_locations && product.shipping_locations.length > 0 && (
              <div className="border rounded-lg p-4 bg-blue-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-sm">Shipping Options</h3>
                </div>
                <div className="space-y-2">
                  {product.shipping_locations.map((ship, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{ship.location}</span>
                      </div>
                      <span className="font-semibold text-blue-600">₦{Number(ship.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">Delivery: 2-5 business days</p>
              </div>
            )}
            <div className="border-t pt-6 space-y-4">
              <span className="text-3xl font-bold">${Number(product.price).toFixed(2)}</span>
              <div>
                <label className="text-sm font-semibold block mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="text-xl w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={product.stock_quantity !== undefined && quantity >= product.stock_quantity}
                  >
                    +
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={product.stock_quantity !== undefined && product.stock_quantity <= 0}
                className="w-full h-12 text-lg"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
