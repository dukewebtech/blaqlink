"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
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

export function ProductDetailModal({ product, open, onOpenChange, storeName = "Store Owner" }: ProductDetailModalProps) {
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

  const isEventTicket = product?.product_type === "event"
  const isAppointment = product?.product_type === "appointment"
  const isDigitalProduct = product?.product_type === "digital"

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  const handleAddToCart = () => {
    const metadata = isAppointment && selectedDate && selectedTimeSlot ? { appointment_date: selectedDate.toISOString(), appointment_time: selectedTimeSlot } : selectedTicketType ? { ticket_type: selectedTicketType.name } : undefined

    cartStore.addItem({ id: product.id, title: product.title, price: isEventTicket && selectedTicketType ? Number.parseFloat(selectedTicketType.price) : product.price, product_type: product.product_type, images: product.images }, quantity, metadata)
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
    return date.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
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
    const dayMap: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" }
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

  const hasMultipleImages = product?.images && product.images.length > 1

  if (!product || !open) return null

  if (isDigitalProduct) {
    const fileCount = product.file_urls?.length || 0
    const hasFiles = fileCount > 0
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => onOpenChange(false)}>
        <div className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"><X className="h-6 w-6" /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="relative bg-gray-100">{hasMultipleImages && (<button onClick={handlePreviousImage} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"><ChevronLeft className="h-6 w-6" /></button>)}{product.images && product.images.length > 0 ? (<img src={product.images[currentImageIndex] || "/placeholder.svg"} alt={product.title} className="w-full h-full object-cover min-h-[400px]" />) : (<div className="flex h-[400px] items-center justify-center"><div className="text-center"><div className="h-24 w-24 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center"><svg className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div><p className="text-sm text-gray-500">Digital Product</p></div></div>)}{hasMultipleImages && (<button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"><ChevronRight className="h-6 w-6" /></button>)}{hasMultipleImages && (<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">{product.images.map((_, index) => (<button key={index} onClick={() => setCurrentImageIndex(index)} className={`h-2 rounded-full transition-all ${index === currentImageIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"}`} />))}</div>)}</div>
            <div className="p-8 space-y-6"><div>{product.category && (<Badge variant="secondary" className="mb-2">{product.category}</Badge>)}<h2 className="text-3xl font-bold text-balance">{product.title}</h2><p className="text-sm text-gray-500 mt-2">By {storeName}</p></div><div className="border rounded-lg p-4 space-y-3 bg-gradient-to-br from-purple-50 to-blue-50"><div className="flex items-center gap-2"><svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg><Badge variant="default" className="bg-purple-600 hover:bg-purple-700 text-white">Instant Download</Badge></div>{product.license_type && (<div className="flex items-center gap-2 text-sm"><svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg><div><p className="font-medium capitalize">{product.license_type} License</p><p className="text-xs text-gray-600">{product.license_type === "extended" ? "Commercial use allowed" : "Personal use only"}</p></div></div>)}{product.download_limit !== null && product.download_limit !== undefined && (<div className="flex items-center gap-2 text-sm"><svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg><p className="font-medium">{product.download_limit === 0 || product.download_limit > 100 ? "Unlimited Downloads" : `${product.download_limit} Download${product.download_limit !== 1 ? "s" : ""} Allowed`}</p></div>)}{hasFiles && (<div className="flex items-center gap-2 text-sm"><svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg><p className="font-medium">{fileCount} File{fileCount !== 1 ? "s" : ""} Available</p></div>)}<div className="space-y-4"><h3 className="text-xl font-semibold">Description</h3><p className="text-gray-600">{product.description}</p></div></div>
        </div>
      </div>
    )
  }

  return null
}\
