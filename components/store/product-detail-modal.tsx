"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Minus, Plus, ChevronLeft, ChevronRight, X, ChevronDown, Calendar, MapPin, Users } from "lucide-react"
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

  useEffect(() => {
    setCurrentImageIndex(0)
    setQuantity(1)
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

  const isEventTicket = product?.product_type === "event"

  const hasMultipleImages = product?.images && product.images.length > 1

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  const handleAddToCart = () => {
    cartStore.addItem(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        product_type: product.product_type,
        images: product.images,
      },
      quantity,
    )
    onOpenChange(false)
  }

  const getDaysUntilEvent = (eventDate: string) => {
    const now = new Date()
    const event = new Date(eventDate)
    const diffTime = event.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatEventDate = (eventDate: string) => {
    const date = new Date(eventDate)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!product || !open) return null

  if (isEventTicket) {
    const daysUntil = product.event_date ? getDaysUntilEvent(product.event_date) : 0

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative h-64 w-full bg-gray-100">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Calendar className="h-16 w-16 text-gray-300" />
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
              <h2 className="text-3xl font-bold text-balance">{product.title}</h2>
            </div>

            <div className="border rounded-lg p-5 space-y-3 bg-gray-50">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-5 w-5 text-[#7C3AED]" />
                <div>
                  <p className="font-medium text-base">
                    {product.event_date ? formatEventDate(product.event_date) : "Date TBA"}
                  </p>
                  {daysUntil > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {daysUntil} {daysUntil === 1 ? "day" : "days"} away
                    </p>
                  )}
                </div>
              </div>

              {product.event_location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-5 w-5 text-[#7C3AED]" />
                  <p className="font-medium text-base">{product.event_location}</p>
                </div>
              )}

              {product.total_capacity && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-5 w-5 text-[#7C3AED]" />
                  <p className="font-medium text-base">Capacity: {product.total_capacity} attendees</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">About This Event</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {product.is_paid_ticket && product.ticket_types && product.ticket_types.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Select Ticket Type</h3>
                <div className="space-y-2">
                  {product.ticket_types.map((ticket) => (
                    <button
                      key={ticket.name}
                      onClick={() => setSelectedTicketType(ticket)}
                      className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                        selectedTicketType?.name === ticket.name
                          ? "border-[#7C3AED] bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-semibold text-base">{ticket.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.total_capacity && product.total_capacity > 0
                            ? `${product.total_capacity} remaining`
                            : "Available"}
                        </p>
                      </div>
                      <p className="text-xl font-bold">NGN {Number.parseFloat(ticket.price).toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-lg mb-3">Number of Tickets</h3>
              <div className="inline-flex items-center gap-0 border border-gray-300 rounded-full overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none hover:bg-gray-50"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-normal w-16 text-center border-x border-gray-300">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none hover:bg-gray-50"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={product.total_capacity ? quantity >= product.total_capacity : false}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Price</p>
                <p className="text-3xl font-bold">
                  NGN{" "}
                  {selectedTicketType
                    ? (Number.parseFloat(selectedTicketType.price) * quantity).toLocaleString()
                    : (product.price * quantity).toLocaleString()}
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={product.total_capacity === 0}
                className="h-14 px-8 text-base bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-medium"
              >
                {product.total_capacity === 0 ? "Sold Out" : "Get Tickets"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[90vw] h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="grid grid-cols-[55%_45%] h-full">
          <div className="relative bg-gray-50 flex flex-col">
            <div className="flex-1 relative flex items-center justify-center p-8">
              {product.images?.[currentImageIndex] ? (
                <img
                  src={product.images[currentImageIndex] || "/placeholder.svg"}
                  alt={product.title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center text-muted-foreground text-xl">No Image Available</div>
              )}

              {hasMultipleImages && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full shadow-xl h-12 w-12 hover:scale-110 transition-transform"
                    onClick={handlePreviousImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full shadow-xl h-12 w-12 hover:scale-110 transition-transform"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex ? "bg-white w-8" : "bg-white/50 w-2"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {hasMultipleImages && (
              <div className="p-6 border-t bg-white flex gap-3 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      index === currentImageIndex ? "border-purple-600 ring-2 ring-purple-200" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-12 overflow-y-auto flex flex-col">
            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-balance leading-tight">{product.title}</h2>
                <p className="text-base text-gray-500">By {storeName}</p>
              </div>

              {product.description && <p className="text-base text-gray-700 leading-relaxed">{product.description}</p>}

              <div className="space-y-3">
                <label className="text-base text-gray-500 block">How Many</label>
                <div className="inline-flex items-center gap-0 border border-gray-300 rounded-full overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-none hover:bg-gray-50"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-normal w-16 text-center border-x border-gray-300">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-none hover:bg-gray-50"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={product.stock_quantity ? quantity >= product.stock_quantity : false}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-base text-gray-500">Price</p>
                <p className="text-3xl font-bold">NGN {Number(product.price).toLocaleString()}</p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-base bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-medium"
                    onClick={handleAddToCart}
                  >
                    Add to bag
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-14 px-6 text-base text-gray-600 hover:bg-gray-50 rounded-lg font-normal gap-2"
                  >
                    <Heart className="h-5 w-5" />
                    Contact Seller
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {product.stock_quantity !== undefined && (
                  <p className="text-sm text-gray-500">
                    {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
