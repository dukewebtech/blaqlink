"use client"

import type React from "react"
import { useState, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Package,
  Ticket,
  FileDigit,
  Calendar,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type ProductType = "digital" | "physical" | "event" | "appointment"

type ParsedProduct = {
  row: number
  title: string
  description: string
  price: string
  product_type: ProductType
  category: string
  status: string
  images: string
  sku: string
  stock_quantity: string
  event_date: string
  event_location: string
  duration_minutes: string
  errors: string[]
  isValid: boolean
}

type ImportResult = {
  success: boolean
  imported: number
  failed: number
  errors: { row: number; error: string }[]
}

const CSV_TEMPLATES: Record<ProductType, { headers: string[]; sample: string[] }> = {
  digital: {
    headers: ["title", "description", "price", "category", "status", "images"],
    sample: [
      "My Digital Product",
      "A great digital download",
      "29.99",
      "ebooks",
      "draft",
      "https://example.com/image.jpg",
    ],
  },
  physical: {
    headers: ["title", "description", "price", "category", "status", "images", "sku", "stock_quantity"],
    sample: [
      "Physical Item",
      "A tangible product",
      "49.99",
      "clothing",
      "draft",
      "https://example.com/image.jpg",
      "SKU-001",
      "100",
    ],
  },
  event: {
    headers: [
      "title",
      "description",
      "price",
      "category",
      "status",
      "images",
      "event_date",
      "event_location",
      "stock_quantity",
    ],
    sample: [
      "My Event",
      "Join us for this event",
      "19.99",
      "concerts",
      "draft",
      "https://example.com/image.jpg",
      "2025-01-15T18:00:00",
      "New York, NY",
      "500",
    ],
  },
  appointment: {
    headers: ["title", "description", "price", "category", "status", "images", "duration_minutes"],
    sample: [
      "Consultation",
      "1-hour consultation",
      "99.99",
      "consulting",
      "draft",
      "https://example.com/image.jpg",
      "60",
    ],
  },
}

const VALID_STATUSES = ["draft", "published", "archived"]

export default function ProductImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedType, setSelectedType] = useState<ProductType>("physical")
  const [file, setFile] = useState<File | null>(null)
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const downloadTemplate = (type: ProductType) => {
    const template = CSV_TEMPLATES[type]
    const csvContent = [template.headers.join(","), template.sample.join(",")].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${type}_products_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (content: string): ParsedProduct[] => {
    const lines = content.split("\n").filter((line) => line.trim())
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row")
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const products: ParsedProduct[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const product: ParsedProduct = {
        row: i + 1,
        title: "",
        description: "",
        price: "",
        product_type: selectedType,
        category: "",
        status: "draft",
        images: "",
        sku: "",
        stock_quantity: "",
        event_date: "",
        event_location: "",
        duration_minutes: "",
        errors: [],
        isValid: true,
      }

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || ""
        switch (header) {
          case "title":
            product.title = value
            break
          case "description":
            product.description = value
            break
          case "price":
            product.price = value
            break
          case "category":
            product.category = value
            break
          case "status":
            const normalizedStatus = value.toLowerCase().trim()
            product.status = VALID_STATUSES.includes(normalizedStatus) ? normalizedStatus : "draft"
            break
          case "images":
            product.images = value
            break
          case "sku":
            product.sku = value
            break
          case "stock_quantity":
            product.stock_quantity = value
            break
          case "event_date":
            product.event_date = value
            break
          case "event_location":
            product.event_location = value
            break
          case "duration_minutes":
            product.duration_minutes = value
            break
        }
      })

      // Validate required fields
      if (!product.title) {
        product.errors.push("Title is required")
        product.isValid = false
      }

      if (product.price && isNaN(Number.parseFloat(product.price))) {
        product.errors.push("Price must be a valid number")
        product.isValid = false
      }

      if (product.stock_quantity && isNaN(Number.parseInt(product.stock_quantity))) {
        product.errors.push("Stock quantity must be a valid number")
        product.isValid = false
      }

      if (selectedType === "physical" && !product.sku) {
        product.errors.push("SKU is recommended for physical products")
      }

      if (selectedType === "event" && !product.event_date) {
        product.errors.push("Event date is recommended for events")
      }

      products.push(product)
    }

    return products
  }

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current)
        current = ""
      } else {
        current += char
      }
    }
    values.push(current)
    return values
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setParseError(null)
    setImportResult(null)
    setIsParsing(true)

    try {
      const content = await selectedFile.text()
      const products = parseCSV(content)
      setParsedProducts(products)
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Failed to parse CSV")
      setParsedProducts([])
    } finally {
      setIsParsing(false)
    }
  }

  const handleImport = async () => {
    const validProducts = parsedProducts.filter((p) => p.isValid)
    if (validProducts.length === 0) {
      setParseError("No valid products to import")
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: validProducts.map((p) => ({
            title: p.title,
            description: p.description || null,
            price: p.price ? Number.parseFloat(p.price) : null,
            product_type: p.product_type,
            category: p.category || null,
            status: p.status || "draft",
            images: p.images
              ? p.images
                  .split(";")
                  .map((url) => url.trim())
                  .filter(Boolean)
              : [],
            sku: p.sku || null,
            stock_quantity: p.stock_quantity ? Number.parseInt(p.stock_quantity) : null,
            event_date: p.event_date || null,
            event_location: p.event_location || null,
            duration_minutes: p.duration_minutes ? Number.parseInt(p.duration_minutes) : null,
          })),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Import failed")
      }

      setImportResult(result)
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }

  const validCount = parsedProducts.filter((p) => p.isValid).length
  const invalidCount = parsedProducts.filter((p) => !p.isValid).length

  const productTypeIcons = {
    digital: FileDigit,
    physical: Package,
    event: Ticket,
    appointment: Calendar,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/products-list")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Import Products via CSV</h1>
            <p className="text-muted-foreground">Bulk import products from a CSV file</p>
          </div>
        </div>

        {/* Success Result */}
        {importResult && importResult.success && (
          <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Import Successful</AlertTitle>
            <AlertDescription>
              Successfully imported {importResult.imported} products.
              {importResult.failed > 0 && ` ${importResult.failed} products failed to import.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {parseError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select Product Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                1
              </span>
              Select Product Type
            </CardTitle>
            <CardDescription>
              Choose the type of products you want to import. This determines the CSV template.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["digital", "physical", "event", "appointment"] as ProductType[]).map((type) => {
                const Icon = productTypeIcons[type]
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedType(type)
                      setParsedProducts([])
                      setFile(null)
                      setImportResult(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
                      selectedType === type ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    )}
                  >
                    <Icon className={cn("h-8 w-8", selectedType === type ? "text-primary" : "text-muted-foreground")} />
                    <span
                      className={cn(
                        "text-sm font-medium capitalize",
                        selectedType === type ? "text-primary" : "text-foreground",
                      )}
                    >
                      {type}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Download Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                2
              </span>
              Download CSV Template
            </CardTitle>
            <CardDescription>
              Download the template for {selectedType} products, fill it with your data, then upload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button variant="outline" onClick={() => downloadTemplate(selectedType)} className="gap-2">
                <Download className="h-4 w-4" />
                Download {selectedType} Template
              </Button>
              <div className="text-sm text-muted-foreground">
                <p>
                  Required columns: <span className="font-medium">title</span>
                </p>
                <p>
                  Optional: description, price, category, status, images
                  {selectedType === "physical" ? ", sku, stock_quantity" : ""}
                  {selectedType === "event" ? ", event_date, event_location, stock_quantity" : ""}
                  {selectedType === "appointment" ? ", duration_minutes" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Upload CSV */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                3
              </span>
              Upload Your CSV
            </CardTitle>
            <CardDescription>Select your filled CSV file to preview and import products.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
                "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
              {isParsing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-muted-foreground">Parsing CSV...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="h-10 w-10 text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">Click to select a different file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Click to upload CSV</p>
                  <p className="text-sm text-muted-foreground">or drag and drop</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Preview & Import */}
        {parsedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                      4
                    </span>
                    Preview & Import
                  </CardTitle>
                  <CardDescription>
                    Review parsed products before importing. Only valid products will be imported.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {validCount} Valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      {invalidCount} Invalid
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead className="w-16">Status</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        {selectedType === "physical" && <TableHead>SKU</TableHead>}
                        {selectedType === "physical" && <TableHead>Stock</TableHead>}
                        {selectedType === "event" && <TableHead>Event Date</TableHead>}
                        {selectedType === "appointment" && <TableHead>Duration</TableHead>}
                        <TableHead>Issues</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedProducts.map((product) => (
                        <TableRow key={product.row} className={cn(!product.isValid && "bg-red-500/5")}>
                          <TableCell className="font-mono text-sm">{product.row}</TableCell>
                          <TableCell>
                            {product.isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{product.title || "-"}</TableCell>
                          <TableCell>{product.price ? `$${product.price}` : "-"}</TableCell>
                          <TableCell>{product.category || "-"}</TableCell>
                          {selectedType === "physical" && <TableCell>{product.sku || "-"}</TableCell>}
                          {selectedType === "physical" && <TableCell>{product.stock_quantity || "-"}</TableCell>}
                          {selectedType === "event" && <TableCell>{product.event_date || "-"}</TableCell>}
                          {selectedType === "appointment" && (
                            <TableCell>{product.duration_minutes ? `${product.duration_minutes}min` : "-"}</TableCell>
                          )}
                          <TableCell>
                            {product.errors.length > 0 ? (
                              <span className="text-sm text-red-600">{product.errors.join(", ")}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {validCount} of {parsedProducts.length} products will be imported as{" "}
                  <Badge variant="secondary">draft</Badge>
                </p>
                <Button onClick={handleImport} disabled={validCount === 0 || isImporting} className="gap-2">
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import {validCount} Products
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
