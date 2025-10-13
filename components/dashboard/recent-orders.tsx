"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from "lucide-react"
import Image from "next/image"

const orders = [
  {
    id: "021231",
    product: "Kanky Kitadakate (Green)",
    customer: "Joe Martin",
    price: "N3,000",
    status: "Success",
    image: "/green-sneakers.jpg",
  },
  {
    id: "021231",
    product: "Kanky Kitadakate (Green)",
    customer: "Fredrick Ogoo",
    price: "N37,000",
    status: "Success",
    image: "/green-sneakers.jpg",
  },
  {
    id: "021231",
    product: "Kanky Kitadakate (Green)",
    customer: "Pascal Richmond",
    price: "N65,090",
    status: "Success",
    image: "/green-sneakers.jpg",
  },
  {
    id: "021231",
    product: "Kanky Kitadakate (Green)",
    customer: "Yoma Oke",
    price: "N879,000",
    status: "Success",
    image: "/green-sneakers.jpg",
  },
]

export function RecentOrders() {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1">
            Show All
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={order.image || "/placeholder.svg"}
                          alt={order.product}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{order.id}</p>
                        <p className="text-sm font-medium">{order.product}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm">{order.customer}</td>
                  <td className="py-4 px-4 text-sm font-medium">{order.price}</td>
                  <td className="py-4 px-4">
                    <Badge className="bg-success/10 text-success hover:bg-success/20 border-0">{order.status}</Badge>
                  </td>
                  <td className="py-4 px-4">
                    <Button size="sm" className="bg-[#1e293b] hover:bg-[#1e293b]/90 text-white">
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
