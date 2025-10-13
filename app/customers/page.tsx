"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

const customers = [
  {
    id: "ID12451",
    name: "Leslie Alexander",
    email: "georgia@example.com",
    phone: "+62 819 1314 1435",
    purchases: "$21.78",
    orders: "30 Order",
    address: "2972 Westheimer Rd. Santa Ana, Illinois 85486",
  },
  {
    id: "ID12452",
    name: "Guy Hawkins",
    email: "guys@example.com",
    phone: "+62 819 1314 1435",
    purchases: "$21.78",
    orders: "30 Order",
    address: "4517 Washington Ave. Manchester, Kentucky 39495",
  },
  {
    id: "ID12453",
    name: "Kristin Watson",
    email: "kristin@example.com",
    phone: "+62 819 1314 1435",
    purchases: "$21.78",
    orders: "30 Order",
    address: "2118 Thornridge Cir. Syracuse, Connecticut 35624",
  },
  {
    id: "ID12453",
    name: "Kristin Watson",
    email: "kristin@example.com",
    phone: "+62 819 1314 1435",
    purchases: "$21.78",
    orders: "30 Order",
    address: "2118 Thornridge Cir. Syracuse, Connecticut 35624",
  },
  {
    id: "ID12452",
    name: "Guy Hawkins",
    email: "guys@example.com",
    phone: "+62 819 1314 1435",
    purchases: "$21.78",
    orders: "30 Order",
    address: "4517 Washington Ave. Manchester, Kentucky 39495",
  },
  {
    id: "ID12451",
    name: "Leslie Alexander",
    email: "georgia@example.com",
    phone: "+62 819 1314 1435",
    purchases: "$21.78",
    orders: "30 Order",
    address: "2972 Westheimer Rd. Santa Ana, Illinois 85486",
  },
  {
    id: "ID12453",
    name: "Kristin Watson",
    email: "kristin@example.com",
    phone: "+62 819 1314 1435",
    purchases: "$21.78",
    orders: "30 Order",
    address: "2118 Thornridge Cir. Syracuse, Connecticut 35624",
  },
  {
    id: "ID12451",
    name: "Leslie Alexander",
    email: "georgia@example.com",
    phone: "+62 819 1314 1435",
    purchases: "$21.78",
    orders: "30 Order",
    address: "2972 Westheimer Rd. Santa Ana, Illinois 85486",
  },
]

export default function CustomersPage() {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const toggleCustomer = (id: string) => {
    setSelectedCustomers((prev) => (prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    setSelectedCustomers((prev) => (prev.length === customers.length ? [] : customers.map((c) => c.id)))
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customer</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Dashboard</span>
            <span>›</span>
            <span className="text-primary font-medium">Customer</span>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search for id, name Customer"
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
            <Button className="gap-2">
              <Plus className="size-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="w-12">
                  <Checkbox checked={selectedCustomers.length === customers.length} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center gap-1">
                    Name Customer
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
                    Purchases
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center gap-1">
                    Order QTY
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center gap-1">
                    Address
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
              {customers.map((customer, index) => (
                <TableRow key={`${customer.id}-${index}`} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={() => toggleCustomer(customer.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs text-primary font-medium">{customer.id}</span>
                      <span className="font-medium text-foreground">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="text-foreground">{customer.email}</span>
                      <span className="text-muted-foreground">{customer.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{customer.purchases}</TableCell>
                  <TableCell className="text-foreground">{customer.orders}</TableCell>
                  <TableCell className="text-foreground max-w-xs">{customer.address}</TableCell>
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
            <div className="text-sm text-muted-foreground">1 - 10 of 13 Pages</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">The page on</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-12 gap-1 bg-transparent">
                    1
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>1</DropdownMenuItem>
                  <DropdownMenuItem>2</DropdownMenuItem>
                  <DropdownMenuItem>3</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="icon" className="size-8 bg-transparent">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-8 bg-transparent">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
