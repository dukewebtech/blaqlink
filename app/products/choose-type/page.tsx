"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, Download, Calendar, ShoppingBag, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const productTypes = [
  {
    id: "digital",
    title: "Digital Product",
    description: "Sell downloadable content like sets of files, e-books or videos.",
    icon: Download,
    color: "from-primary via-primary/90 to-primary/80",
    textColor: "text-white",
  },
  {
    id: "event",
    title: "Event Ticket",
    description: "Set up your events and add paid or free tickets.",
    icon: Ticket,
    color: "from-blue-100 to-blue-50",
    textColor: "text-blue-900",
  },
  {
    id: "physical",
    title: "Physical Products",
    description: "Sell physical products like cloths and bag on your store.",
    icon: ShoppingBag,
    color: "from-cyan-500 to-cyan-400",
    textColor: "text-white",
  },
  {
    id: "appointment",
    title: "Paid Appointments",
    description: "Allow Users book your calendar",
    icon: Calendar,
    color: "from-green-500 to-green-400",
    textColor: "text-white",
  },
]

export default function ChooseProductTypePage() {
  const router = useRouter()

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Choose a product type</h1>
          <p className="text-muted-foreground mt-1">Select any of the types that best fit your product</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium text-sm">
            Choose a product type
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm">
            Add Product
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm">
            Preview and Publish
          </div>
        </div>

        {/* Product Type Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {productTypes.map((type, index) => (
            <Card
              key={type.id}
              className={cn(
                "group relative overflow-hidden border-0 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-4",
                "bg-gradient-to-br",
                type.color,
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => router.push(`/products/create?type=${type.id}`)}
            >
              <div className="p-8 space-y-4">
                <div className="flex items-start justify-between">
                  <type.icon className={cn("h-8 w-8", type.textColor)} />
                  <ArrowUpRight
                    className={cn(
                      "h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1",
                      type.textColor,
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className={cn("text-xl font-bold", type.textColor)}>{type.title}</h3>
                  <p className={cn("text-sm leading-relaxed", type.textColor, "opacity-90")}>{type.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
