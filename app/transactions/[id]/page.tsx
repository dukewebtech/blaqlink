"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, Phone, MapPin, CreditCard, Truck, CheckCircle2, XCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Mock data - in a real app, this would come from an API
const orderData = {
  id: "021231",
  date: "April 17, 2023 at 8:25 PM",
  customer: {
    name: "Leslie Alexander",
    email: "georgia@example.com",
    phone: "+62 819 1314 1435",
    address: "2972 Westheimer Rd. Santa Ana, Illinois 85486",
  },
  items: [
    {
      id: "1",
      name: "Kanky Kitadakate (Green)",
      image: "/green-sneakers.jpg",
      price: 20.0,
      quantity: 2,
      subtotal: 40.0,
    },
    {
      id: "2",
      name: "Story Honzo (Cream)",
      image: "/green-sneakers.jpg",
      price: 18.5,
      quantity: 1,
      subtotal: 18.5,
    },
  ],
  payment: {
    method: "Credit Card",
    cardNumber: "**** **** **** 4532",
    status: "paid",
  },
  delivery: {
    method: "Standard Shipping",
    provider: "DHL Express",
    trackingNumber: "DHL123456789",
  },
  status: "shipping",
  subtotal: 58.5,
  shipping: 5.0,
  tax: 5.85,
  total: 69.35,
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/transactions">
                <Button variant="ghost" size="icon" className="size-8">
                  <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold text-foreground">Order Details</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-11">
              <span>Dashboard</span>
              <span>›</span>
              <span>Orders</span>
              <span>›</span>
              <span className="text-primary font-medium">Order #{id}</span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="text-lg font-semibold text-foreground">#{orderData.id}</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="text-sm font-medium text-foreground">{orderData.date}</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Customer</p>
                  <p className="text-sm font-medium text-foreground">{orderData.customer.name}</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-lg font-semibold text-foreground">${orderData.total.toFixed(2)}</p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={`
                  ${orderData.status === "shipping" ? "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" : ""}
                  ${orderData.status === "completed" ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" : ""}
                  ${orderData.status === "cancelled" ? "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" : ""}
                  px-4 py-1.5 text-sm font-medium
                `}
              >
                {orderData.status === "shipping" && "Shipping"}
                {orderData.status === "completed" && "Completed"}
                {orderData.status === "cancelled" && "Cancelled"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer Details & Items */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Customer Details */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">
                      {orderData.customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">{orderData.customer.name}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="size-4" />
                        <span>{orderData.customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="size-4" />
                        <span>{orderData.customer.phone}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-4 mt-0.5 flex-shrink-0" />
                        <span>{orderData.customer.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Ordered */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Items Ordered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative size-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground mb-1">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">${item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}

                  <Separator className="my-4" />

                  {/* Order Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-foreground">${orderData.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium text-foreground">${orderData.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium text-foreground">${orderData.tax.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="text-xl font-bold text-primary">${orderData.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment & Delivery Info */}
          <div className="flex flex-col gap-6">
            {/* Payment Method */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground mb-0.5">{orderData.payment.method}</p>
                    <p className="text-sm text-muted-foreground">{orderData.payment.cardNumber}</p>
                  </div>
                </div>
                <Badge
                  variant="default"
                  className="w-full justify-center bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                >
                  Payment {orderData.payment.status === "paid" ? "Completed" : "Pending"}
                </Badge>
              </CardContent>
            </Card>

            {/* Delivery Option */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Delivery Option</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground mb-0.5">{orderData.delivery.method}</p>
                    <p className="text-sm text-muted-foreground">{orderData.delivery.provider}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Tracking Number</p>
                  <p className="text-sm font-mono font-medium text-foreground">{orderData.delivery.trackingNumber}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2" size="lg">
                  <CheckCircle2 className="size-4" />
                  Mark as Completed
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                  size="lg"
                >
                  <XCircle className="size-4" />
                  Cancel Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
