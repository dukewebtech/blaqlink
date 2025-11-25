"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Download, Calendar, MapPin, Clock, Package, FileText, Ticket, Video, CheckCircle } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface OrderItem {
  product_id: string
  product_title: string
  product_type: string
  quantity: number
  price: number
  subtotal: number
  appointment_date?: string
  appointment_time?: string
  product_details?: {
    id: string
    title: string
    product_type: string
    images?: string[]
    file_urls?: string[]
    event_date?: string
    event_location?: string
    duration_minutes?: number
    booking_link?: string
    license_type?: string
    download_limit?: number
  }
}

interface OrderData {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  shipping_address?: {
    street?: string
    city?: string
    state?: string
  }
  total_amount: number
  payment_reference: string
  status: string
  items: OrderItem[]
}

interface VendorInfo {
  store_name?: string
  business_name?: string
  store_logo_url?: string
  email?: string
  phone?: string
  business_address?: string
}

interface OrderConfirmationDocumentProps {
  order: OrderData
  vendor?: VendorInfo | null
}

export function OrderConfirmationDocument({ order, vendor }: OrderConfirmationDocumentProps) {
  const documentRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    // Use browser's print to PDF functionality
    window.print()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const addToCalendar = (item: OrderItem) => {
    let startDate: Date
    let endDate: Date
    let title: string
    let location = ""
    let description = ""

    if (item.product_type === "event" && item.product_details?.event_date) {
      startDate = new Date(item.product_details.event_date)
      endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000) // 3 hours default
      title = item.product_title
      location = item.product_details.event_location || ""
      description = `Ticket for ${item.product_title}. Order ID: ${order.id.slice(0, 8)}`
    } else if (item.product_type === "appointment" && item.appointment_date && item.appointment_time) {
      const [hours, minutes] = item.appointment_time.split(":").map(Number)
      startDate = new Date(item.appointment_date)
      startDate.setHours(hours || 0, minutes || 0)
      const duration = item.product_details?.duration_minutes || 60
      endDate = new Date(startDate.getTime() + duration * 60 * 1000)
      title = `Appointment: ${item.product_title}`
      location = item.product_details?.booking_link || ""
      description = `Appointment with ${vendor?.store_name || vendor?.business_name}. Order ID: ${order.id.slice(0, 8)}`
    } else {
      return
    }

    // Create Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}/${endDate
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`

    window.open(googleCalendarUrl, "_blank")
  }

  // Group items by product type
  const physicalItems = order.items.filter((item) => item.product_type === "physical")
  const digitalItems = order.items.filter((item) => item.product_type === "digital")
  const eventItems = order.items.filter((item) => item.product_type === "event")
  const appointmentItems = order.items.filter((item) => item.product_type === "appointment")

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      {/* Action Buttons - Hidden in Print */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-end gap-3 print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
        <Button onClick={handleDownloadPDF}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Document Content */}
      <div
        ref={documentRef}
        className="max-w-3xl mx-auto bg-white rounded-lg border shadow-sm print:shadow-none print:border-0"
      >
        {/* Header */}
        <div className="p-8 border-b">
          <div className="flex items-start justify-between">
            <div>
              {vendor?.store_logo_url ? (
                <img
                  src={vendor.store_logo_url || "/placeholder.svg"}
                  alt={vendor.store_name || "Store"}
                  className="h-12 w-auto mb-2"
                />
              ) : (
                <h1 className="text-2xl font-bold text-foreground">
                  {vendor?.store_name || vendor?.business_name || "Store"}
                </h1>
              )}
              {vendor?.business_address && <p className="text-sm text-muted-foreground">{vendor.business_address}</p>}
              {vendor?.phone && <p className="text-sm text-muted-foreground">{vendor.phone}</p>}
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-2">
                <CheckCircle className="w-4 h-4" />
                Payment Successful
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="p-8 border-b bg-muted/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Order ID</p>
              <p className="font-mono font-semibold">{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Reference</p>
              <p className="font-mono font-semibold">{order.payment_reference.slice(0, 12)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Customer</p>
              <p className="font-semibold">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Paid</p>
              <p className="font-bold text-lg text-green-600">NGN {order.total_amount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Event Tickets Section */}
        {eventItems.length > 0 && (
          <div className="p-8 border-b">
            <div className="flex items-center gap-2 mb-6">
              <Ticket className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Event Tickets</h2>
            </div>
            {eventItems.map((item, index) => (
              <div key={index} className="bg-muted/30 rounded-lg p-6 mb-4 last:mb-0">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <QRCodeSVG
                      value={`ORDER:${order.id}|ITEM:${item.product_id}|QTY:${item.quantity}`}
                      size={120}
                      level="H"
                      className="bg-white p-2 rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-2">{item.product_title}</h3>
                    <div className="space-y-2 text-sm">
                      {item.product_details?.event_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{formatDate(item.product_details.event_date)}</span>
                          <span className="text-muted-foreground">at</span>
                          <span>{formatTime(item.product_details.event_date)}</span>
                        </div>
                      )}
                      {item.product_details?.event_location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{item.product_details.event_location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {item.quantity} ticket(s) x NGN {item.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 print:hidden bg-transparent"
                      onClick={() => addToCalendar(item)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Add to Calendar
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">Show this QR code at entry</p>
              </div>
            ))}
          </div>
        )}

        {/* Appointment Section */}
        {appointmentItems.length > 0 && (
          <div className="p-8 border-b">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Appointment Bookings</h2>
            </div>
            {appointmentItems.map((item, index) => (
              <div key={index} className="bg-muted/30 rounded-lg p-6 mb-4 last:mb-0">
                <h3 className="font-bold text-xl mb-4">{item.product_title}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground mb-1">Date</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {item.appointment_date ? formatDate(item.appointment_date) : "To be scheduled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Time</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {item.appointment_time || "To be confirmed"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Duration</p>
                    <p className="font-semibold">{item.product_details?.duration_minutes || 60} minutes</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Format</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video Call
                    </p>
                  </div>
                </div>
                {item.product_details?.booking_link && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                    <p className="text-xs text-blue-600 mb-1">Meeting Link</p>
                    <a
                      href={item.product_details.booking_link}
                      className="text-blue-700 font-medium hover:underline break-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.product_details.booking_link}
                    </a>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="print:hidden bg-transparent"
                  onClick={() => addToCalendar(item)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Add to Calendar
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Digital Downloads Section */}
        {digitalItems.length > 0 && (
          <div className="p-8 border-b">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Digital Downloads</h2>
            </div>
            {digitalItems.map((item, index) => (
              <div key={index} className="bg-muted/30 rounded-lg p-6 mb-4 last:mb-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{item.product_title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.product_details?.license_type === "extended" ? "Extended License" : "Standard License"}
                    </p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                    Ready to Download
                  </span>
                </div>
                {item.product_details?.file_urls && item.product_details.file_urls.length > 0 && (
                  <div className="space-y-2 print:hidden">
                    {item.product_details.file_urls.map((url, fileIndex) => (
                      <a
                        key={fileIndex}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white border rounded p-3 hover:bg-muted/50 transition-colors"
                      >
                        <Download className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Download File {fileIndex + 1}</span>
                      </a>
                    ))}
                  </div>
                )}
                {item.product_details?.download_limit && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Download limit: {item.product_details.download_limit} downloads
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Physical Products Section */}
        {physicalItems.length > 0 && (
          <div className="p-8 border-b">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Physical Products</h2>
            </div>
            <div className="space-y-4">
              {physicalItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product_title}</h3>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">NGN {item.subtotal.toLocaleString()}</p>
                </div>
              ))}
            </div>
            {order.shipping_address && (
              <div className="mt-6 bg-muted/30 rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Shipping Address</p>
                <p className="font-medium">
                  {order.shipping_address.street && `${order.shipping_address.street}, `}
                  {order.shipping_address.city && `${order.shipping_address.city}, `}
                  {order.shipping_address.state}
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              You will receive shipping updates via email at {order.customer_email}
            </p>
          </div>
        )}

        {/* Order Summary */}
        <div className="p-8 border-b">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.product_title} x {item.quantity}
                </span>
                <span>NGN {item.subtotal.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>NGN {order.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 text-center text-sm text-muted-foreground">
          <p>Thank you for your purchase!</p>
          <p>A copy of this receipt has been sent to {order.customer_email}</p>
          {vendor?.email && <p className="mt-2">For support, contact: {vendor.email}</p>}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
