"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  SlidersHorizontal,
  Download,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

interface Customer {
  email: string
  name: string
  phone: string
  totalPurchases: number
  orderCount: number
  lastOrderDate: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/orders")
      const data = await response.json()

      if (response.ok) {
        // Aggregate customer data from orders
        const customerMap = new Map<string, Customer>()

        data.orders?.forEach((order: any) => {
          const email = order.customer_email
          if (!email) return

          if (customerMap.has(email)) {
            const customer = customerMap.get(email)!
            customer.totalPurchases += Number(order.total_amount || 0)
            customer.orderCount += 1
            if (new Date(order.created_at) > new Date(customer.lastOrderDate)) {
              customer.lastOrderDate = order.created_at
            }
          } else {
            customerMap.set(email, {
              email,
              name: order.customer_name || "Unknown",
              phone: order.customer_phone || "N/A",
              totalPurchases: Number(order.total_amount || 0),
              orderCount: 1,
              lastOrderDate: order.created_at,
            })
          }
        })

        setCustomers(Array.from(customerMap.values()))
      }
    } catch (error) {
      console.error("[v0] Failed to fetch customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      searchQuery === "" ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleCustomer = (email: string) => {
    setSelectedCustomers((prev) => (prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]))
  }

  const toggleAll = () => {
    setSelectedCustomers((prev) =>
      prev.length === filteredCustomers.length ? [] : filteredCustomers.map((c) => c.email),
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Dashboard</span>
            <span>›</span>
            <span className="text-primary font-medium">Customers</span>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search for name, email, or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 bg-transparent">
              <SlidersHorizontal className="size-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No customers match your search" : "No customers yet"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        Name
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        Contact
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        Total Purchases
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        Orders
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        Last Order
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      <div className="flex items-center justify-end gap-1">
                        Action
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.email} className="group hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Checkbox
                          checked={selectedCustomers.includes(customer.email)}
                          onCheckedChange={() => toggleCustomer(customer.email)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">{customer.name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="text-foreground">{customer.email}</span>
                          <span className="text-muted-foreground">{customer.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground font-semibold">
                        NGN {customer.totalPurchases.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-foreground">{customer.orderCount} Orders</TableCell>
                      <TableCell className="text-foreground">
                        {new Date(customer.lastOrderDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="size-8 hover:bg-muted">
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 hover:bg-muted">
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCustomers.length} of {customers.length} customers
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
