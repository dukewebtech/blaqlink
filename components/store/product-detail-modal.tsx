"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  Calendar,
  MapPin,
  Users,
  Clock,
  Video,
} from "lucide-react"
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

  useEffect(() => {
    setCurrentImageIndex(0)
    setQuantity(1)
    setSelectedDate(null)
    setSelectedTimeSlot("")
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
  const isAppointment = product?.product_type === "appointment"

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  const handleAddToCart = () => {
    const metadata =
      isAppointment && selectedDate && selectedTimeSlot
        ? {
            appointment_date: selectedDate.toISOString(),
            appointment_time: selectedTimeSlot,
          }
        : selectedTicketType
          ? {
              ticket_type: selectedTicketType.name,
            }
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getAvailableDates = () => {
    if (!product?.available_days || product.available_days.length === 0) return []

    const dates: Date[] = []
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" })

      if (product.available_days.includes(dayName)) {
        dates.push(date)
      }
    }

    return dates
  }

  const getTimeSlots = () => {
    if (!product?.start_time || !product?.end_time || !product?.duration_minutes) return []

    const slots: string[] = []
    const [startHour, startMin] = product.start_time.split(":").map(Number)
    const [endHour, endMin] = product.end_time.split(":").map(Number)

    let currentHour = startHour
    let currentMin = startMin

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const hour = currentHour % 12 || 12
      const ampm = currentHour >= 12 ? "PM" : "AM"
      const timeStr = `${hour}:${currentMin.toString().padStart(2, "0")} ${ampm}`
      slots.push(timeStr)

      currentMin += product.duration_minutes
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60)
        currentMin = currentMin % 60
      }
    }

    return slots
  }

  const hasMultipleImages = product?.images && product.images.length > 1

  if (!product || !open) return null

  if (isAppointment) {
    const availableDates = getAvailableDates()
    const timeSlots = getTimeSlots()
    const canBookAppointment = selectedDate && selectedTimeSlot

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>

          {product.images && product.images.length > 0 && (
            <div className="relative w-full bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center h-48">
              <img
                src={product.images[0] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}

          <div className="p-8 space-y-6">
            <div>
              {product.category && (
                <Badge variant="secondary" className="mb-2">
                  {product.category}
                </Badge>
              )}
              <h2 className="text-3xl font-bold text-balance">{product.title}</h2>
              <p className="text-sm text-gray-500 mt-2">By {storeName}</p>
            </div>

            <div className="border rounded-lg p-5 space-y-3 bg-gray-50">
              {product.duration_minutes && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-5 w-5 text-[#7C3AED]" />
                  <div>
                    <p className="font-medium text-base">{product.duration_minutes} Minutes Session</p>
                    <p className="text-xs text-gray-500 mt-1">One-on-one consultation</p>
                  </div>
                </div>
              )}

              {product.available_days && product.available_days.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-5 w-5 text-[#7C3AED]" />
                  <div>
                    <p className="font-medium text-base">Available: {product.available_days.join(", ")}</p>
                    {product.start_time && product.end_time && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(product.start_time)} - {formatTime(product.end_time)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {product.booking_link && (
                <div className="flex items-center gap-3 text-sm">
                  <Video className="h-5 w-5 text-[#7C3AED]" />
                  <p className="font-medium text-base">Online video consultation</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">About This Service</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            <div className="border rounded-lg p-5 space-y-5 bg-blue-50 border-blue-200">
              <div>
                <h3 className="font-semibold text-lg mb-3">Select Your Appointment</h3>
                <p className="text-sm text-gray-600 mb-4">Choose a date and time that works best for you</p>

                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium">Select Date</label>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {availableDates.map((date, index) => {
                      const isSelected = selectedDate?.toDateString() === date.toDateString()
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedDate(date)
                            setSelectedTimeSlot("")
                          }}
                          className={`p-3 text-sm rounded-lg border-2 transition-all ${
                            isSelected
                              ? "border-[#7C3AED] bg-[#7C3AED] text-white font-medium"
                              : "border-gray-300 hover:border-[#7C3AED] bg-white"
                          }`}
                        >
                          <div className="text-xs">{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                          <div className="font-semibold">
                            {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Time</label>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {timeSlots.map((time, index) => {
                        const isSelected = selectedTimeSlot === time
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedTimeSlot(time)}
                            className={`p-3 text-sm rounded-lg border-2 transition-all ${
                              isSelected
                                ? "border-[#7C3AED] bg-[#7C3AED] text-white font-medium"
                                : "border-gray-300 hover:border-[#7C3AED] bg-white"
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {canBookAppointment && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-[#7C3AED]">
                    <p className="text-sm font-medium text-[#7C3AED]">
                      📅{" "}
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      at {selectedTimeSlot}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">What's Included</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#7C3AED] mt-1">✓</span>
                  <span>{product.duration_minutes}-minute personalized consultation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7C3AED] mt-1">✓</span>
                  <span>Expert guidance and actionable insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7C3AED] mt-1">✓</span>
                  <span>Follow-up summary via email</span>
                </li>
                {product.booking_link && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#7C3AED] mt-1">✓</span>
                    <span>Calendar invite with video meeting link</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <div>
                <p className="text-sm text-gray-500 mb-1">Session Price</p>
                <p className="text-3xl font-bold">NGN {Number(product.price).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">per session</p>
              </div>
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!canBookAppointment}
                className="h-14 px-8 text-base bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canBookAppointment ? "Book Appointment" : "Select Date & Time"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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

          <div className="relative w-full bg-gray-100 flex items-center justify-center min-h-[300px] max-h-[400px]">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full max-h-[400px] object-contain"
              />
            ) : (
              <div className="flex h-64 items-center justify-center">
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
                  onClick={(e) => {
                    e.stopPropagation()
                    setQuantity((prev) => Math.max(1, prev - 1))
                  }}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-normal w-16 text-center border-x border-gray-300">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    setQuantity((prev) => prev + 1)
                  }}
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
                className="h-14 px-8 text-base bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
