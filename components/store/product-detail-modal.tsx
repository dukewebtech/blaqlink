"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, X, Download, FileText, Shield } from "lucide-react"
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
  const [selectedTicketType, setSelectedTicketType] = useState<{
    name: string
    price: string
  } | null>(null)
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
    const dayMap: Record<string, string> = {
      Mon: "Monday",
      Tue: "Tuesday",
      Wed: "Wednesday",
      Thu: "Thursday",
      Fri: "Friday",
      Sat: "Saturday",
      Sun: "Sunday",
    }

    const availableDaysFull = product.available_days.map((day) => dayMap[day] || day)

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" })
      if (availableDaysFull.includes(dayName)) {
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

    while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
      const hour = currentHour % 12 || 12
      const ampm = currentHour >= 12 ? "PM" : "AM"
      const timeStr = `${hour}:${currentMin.toString().padStart(2, "0")} ${ampm}`
      slots.push(timeStr)

      const nextMin = currentMin + product.duration_minutes
      const nextHour = currentHour + Math.floor(nextMin / 60)
      const adjustedNextMin = nextMin % 60

      if (nextHour > endHour || (nextHour === endHour && adjustedNextMin > endMin)) {
        break
      }

      currentMin = adjustedNextMin
      currentHour = nextHour
    }

    return slots
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isDateAvailable = (date: Date) => {
    const availableDates = getAvailableDates()
    return availableDates.some((availableDate) => availableDate.toDateString() === date.toDateString())
  }

  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const hasMultipleImages = product?.images && product.images.length > 1

  if (isDigitalProduct) {
    const fileCount = product.file_urls?.length || 0
    const hasFiles = fileCount > 0

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="relative bg-gray-100">
              {hasMultipleImages && (
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[currentImageIndex] || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover min-h-[400px]"
                />
              ) : (
                <div className="flex h-[400px] items-center justify-center">
                  <div className="text-center">
                    <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                      <Download className="h-12 w-12 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-500">Digital Product</p>
                  </div>
                </div>
              )}

              {hasMultipleImages && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              {hasMultipleImages && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentImageIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                      }`}
                    />
                  ))}
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
                <p className="text-sm text-gray-500 mt-2">By {storeName}</p>
              </div>

              <div className="border rounded-lg p-4 space-y-3 bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-purple-600" />
                  <Badge variant="default" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Instant Download
                  </Badge>
                </div>

                {product.license_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium capitalize">{product.license_type} License</p>
                      <p className="text-xs text-gray-600">
                        {product.license_type === "extended" ? "Commercial use allowed" : "Personal use only"}
                      </p>
                    </div>
                  </div>
                )}

                {product.download_limit !== null && product.download_limit !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Download className="h-5 w-5 text-green-600" />
                    <p className="font-medium">
                      {product.download_limit === 0 || product.download_limit > 100
                        ? "Unlimited Downloads"
                        : `${product.download_limit} Download${product.download_limit !== 1 ? "s" : ""} Allowed`}
                    </p>
                  </div>
                )}

                {hasFiles && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <p className="font-medium">
                      {fileCount} File{fileCount !== 1 ? "s" : ""} Included
                    </p>
                  </div>
                )}
              </div>

              {product.description && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              <div className="border-t pt-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-bold">${Number(product.price).toFixed(2)}</span>
                    <p className="text-xs text-gray-500 mt-1">One-time purchase</p>
                  </div>
                </div>

                <Button onClick={handleAddToCart} className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700">
                  Purchase & Download
                </Button>

                <p className="text-xs text-center text-gray-500">
                  Instant access after purchase - Download immediately
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isEventTicket) {
    const daysUntil = product.event_date ? getDaysUntilEvent(product.event_date) : null
    const totalPrice = selectedTicketType && quantity ? Number.parseFloat(selectedTicketType.price) * quantity : 0

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

          <div className="relative bg-gray-100 w-full min-h-[300px] max-h-[400px] flex items-center justify-center overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Calendar className="h-24 w-24 text-gray-400" />
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
              <p className="text-sm text-gray-500 mt-2">Hosted by {storeName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {product.event_date && (
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Date & Time</p>
                    <p className="text-sm font-semibold mt-1">{formatEventDate(product.event_date)}</p>
                    {daysUntil !== null && daysUntil > 0 && (
                      <p className="text-xs text-blue-600 mt-1">{daysUntil} days away</p>
                    )}
                  </div>
                </div>
              )}

              {product.event_location && (
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Location</p>
                    <p className="text-sm font-semibold mt-1">{product.event_location}</p>
                  </div>
                </div>
              )}

              {product.total_capacity && (
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Users className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Capacity</p>
                    <p className="text-sm font-semibold mt-1">{product.total_capacity} attendees</p>
                  </div>
                </div>
              )}
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold text-sm mb-2">About This Event</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {product.is_paid_ticket && product.ticket_types && (
              <div className="border-t pt-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-2">Select Ticket Type</label>
                  <div className="space-y-2">
                    {product.ticket_types.map((ticketType, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTicketType(ticketType)}
                        className={`w-full p-4 border rounded-lg text-left transition-all ${
                          selectedTicketType?.name === ticketType.name
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{ticketType.name}</span>
                          <span className="text-lg font-bold">${Number.parseFloat(ticketType.price).toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2">Number of Tickets</label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setQuantity((q) => Math.max(1, q - 1))
                      }}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setQuantity((q) => q + 1)
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-4 border-t">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-3xl font-bold">${totalPrice.toFixed(2)}</span>
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
    const availableDates = getAvailableDates()
    const timeSlots = selectedDate ? getTimeSlots() : []
    const daysInMonth = getDaysInMonth(currentMonth)
    const monthName = currentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })

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

          <div className="p-8 space-y-6">
            <div>
              {product.category && (
                <Badge variant="secondary" className="mb-2">
                  {product.category}
                </Badge>
              )}
              <h2 className="text-3xl font-bold text-balance">{product.title}</h2>
              <p className="text-sm text-gray-500 mt-2">Service by {storeName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {product.duration_minutes && (
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Duration</p>
                    <p className="text-sm font-semibold mt-1">{product.duration_minutes} minutes</p>
                  </div>
                </div>
              )}

              {product.available_days && product.available_days.length > 0 && (
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-green-50">
                  <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Available</p>
                    <p className="text-sm font-semibold mt-1">{product.available_days.join(", ")}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {product.start_time &&
                        product.end_time &&
                        `${formatTime(product.start_time)} - ${formatTime(product.end_time)}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 border rounded-lg bg-purple-50">
                <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Format</p>
                  <p className="text-sm font-semibold mt-1">Video Call</p>
                </div>
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold text-sm mb-2">About This Service</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="border-t pt-6 space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Select Your Appointment</h3>
                <p className="text-sm text-gray-600 mb-4">Choose a date and time that works best for you</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold block mb-3">Select Date</label>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newMonth = new Date(currentMonth)
                            newMonth.setMonth(currentMonth.getMonth() - 1)
                            setCurrentMonth(newMonth)
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold">{monthName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newMonth = new Date(currentMonth)
                            newMonth.setMonth(currentMonth.getMonth() + 1)
                            setCurrentMonth(newMonth)
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}

                        {daysInMonth.map((date, index) => {
                          if (!date) {
                            return <div key={`empty-${index}`} />
                          }

                          const isAvailable = isDateAvailable(date)
                          const isPast = isPastDate(date)
                          const isSelected = selectedDate?.toDateString() === date.toDateString()

                          return (
                            <button
                              key={index}
                              onClick={() => {
                                if (isAvailable && !isPast) {
                                  setSelectedDate(date)
                                  setSelectedTimeSlot("")
                                }
                              }}
                              disabled={!isAvailable || isPast}
                              className={`
                                aspect-square rounded-lg text-sm font-medium transition-all
                                ${isSelected ? "bg-blue-600 text-white" : ""}
                                ${isAvailable && !isPast && !isSelected ? "bg-blue-50 hover:bg-blue-100 text-blue-900" : ""}
                                ${!isAvailable || isPast ? "text-gray-300 cursor-not-allowed" : "cursor-pointer"}
                              `}
                            >
                              {date.getDate()}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {selectedDate && (
                    <div>
                      <label className="text-sm font-semibold block mb-3">Select Time</label>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                              selectedTimeSlot === slot
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-200 hover:border-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDate && selectedTimeSlot && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-900">Selected Appointment</p>
                      <p className="text-sm text-green-700 mt-1">
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

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-bold">${Number(product.price).toFixed(2)}</span>
                  <p className="text-xs text-gray-500 mt-1">Per session</p>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={!selectedDate || !selectedTimeSlot}
                className="w-full h-12 text-lg"
              >
                Book Appointment
              </Button>

              <p className="text-xs text-center text-gray-500">
                You'll receive a booking confirmation and meeting link after purchase
              </p>
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
        className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="relative bg-gray-100 min-h-[300px]">
            {hasMultipleImages && (
              <button
                onClick={handlePreviousImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[currentImageIndex] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center">
                <span className="text-muted-foreground">No Image</span>
              </div>
            )}

            {hasMultipleImages && (
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {hasMultipleImages && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentImageIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
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
              <p className="text-sm text-gray-500 mt-2">By {storeName}</p>
            </div>

            {product.description && <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>}

            {product.stock_quantity !== undefined && (
              <div className="text-sm">
                <span className={`font-medium ${product.stock_quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                </span>
              </div>
            )}

            <div className="border-t pt-6 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">${Number(product.price).toFixed(2)}</span>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setQuantity((q) => Math.max(1, q - 1))
                    }}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setQuantity((q) => q + 1)
                    }}
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
