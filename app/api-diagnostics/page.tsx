"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "success" | "error"
  message: string
  data?: any
}

export default function APIDiagnosticsPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)

  const updateResult = (name: string, status: TestResult["status"], message: string, data?: any) => {
    setResults((prev) => {
      const existing = prev.find((r) => r.name === name)
      if (existing) {
        return prev.map((r) => (r.name === name ? { name, status, message, data } : r))
      }
      return [...prev, { name, status, message, data }]
    })
  }

  const runAllTests = async () => {
    setTesting(true)
    setResults([])

    // Test 1: Check authentication
    updateResult("Authentication", "pending", "Checking authentication status...")
    try {
      const authRes = await fetch("/api/users/me")
      const authData = await authRes.json()
      if (authRes.ok && authData.user) {
        updateResult(
          "Authentication",
          "success",
          `Logged in as: ${authData.user.email} (${authData.user.full_name})`,
          authData.user,
        )
      } else {
        updateResult("Authentication", "error", "Not authenticated. Please log in first.", authData)
      }
    } catch (error) {
      updateResult("Authentication", "error", `Error: ${error}`)
    }

    // Test 2: Get user profile
    updateResult("User Profile", "pending", "Fetching user profile...")
    try {
      const profileRes = await fetch("/api/users/me")
      const profileData = await profileRes.json()
      if (profileRes.ok) {
        updateResult(
          "User Profile",
          "success",
          `Profile ID: ${profileData.user?.id}, Auth ID: ${profileData.user?.auth_id}`,
          profileData.user,
        )
      } else {
        updateResult("User Profile", "error", "Failed to fetch profile", profileData)
      }
    } catch (error) {
      updateResult("User Profile", "error", `Error: ${error}`)
    }

    // Test 3: Get products
    updateResult("Get Products", "pending", "Fetching products...")
    try {
      const productsRes = await fetch("/api/products")
      const productsData = await productsRes.json()
      console.log("[v0] Products API response:", productsData)

      if (productsRes.ok) {
        const count = productsData.products?.length || productsData.length || 0
        const products = productsData.products || productsData || []
        updateResult(
          "Get Products",
          "success",
          `Found ${count} product(s). User IDs: ${products.map((p: any) => p.user_id).join(", ")}`,
          products,
        )
      } else {
        updateResult("Get Products", "error", "Failed to fetch products", productsData)
      }
    } catch (error) {
      updateResult("Get Products", "error", `Error: ${error}`)
    }

    // Test 4: Get categories
    updateResult("Get Categories", "pending", "Fetching categories...")
    try {
      const categoriesRes = await fetch("/api/categories")
      const categoriesData = await categoriesRes.json()
      if (categoriesRes.ok) {
        const count = categoriesData.categories?.length || categoriesData.length || 0
        updateResult("Get Categories", "success", `Found ${count} categor${count === 1 ? "y" : "ies"}`, categoriesData)
      } else {
        updateResult("Get Categories", "error", "Failed to fetch categories", categoriesData)
      }
    } catch (error) {
      updateResult("Get Categories", "error", `Error: ${error}`)
    }

    // Test 5: Get orders
    updateResult("Get Orders", "pending", "Fetching orders...")
    try {
      const ordersRes = await fetch("/api/orders")
      const ordersData = await ordersRes.json()
      if (ordersRes.ok) {
        const count = ordersData.orders?.length || ordersData.length || 0
        updateResult("Get Orders", "success", `Found ${count} order(s)`, ordersData)
      } else {
        updateResult("Get Orders", "error", "Failed to fetch orders", ordersData)
      }
    } catch (error) {
      updateResult("Get Orders", "error", `Error: ${error}`)
    }

    // Test 6: Dashboard stats
    updateResult("Dashboard Stats", "pending", "Fetching dashboard stats...")
    try {
      const statsRes = await fetch("/api/dashboard/stats")
      const statsData = await statsRes.json()
      if (statsRes.ok) {
        updateResult(
          "Dashboard Stats",
          "success",
          `Revenue: ${statsData.totalRevenue}, Products: ${statsData.totalProducts}, Orders: ${statsData.totalTransactions}`,
          statsData,
        )
      } else {
        updateResult("Dashboard Stats", "error", "Failed to fetch stats", statsData)
      }
    } catch (error) {
      updateResult("Dashboard Stats", "error", `Error: ${error}`)
    }

    // Test 7: Public products
    updateResult("Public Products", "pending", "Fetching public products...")
    try {
      const publicRes = await fetch("/api/public/products")
      const publicData = await publicRes.json()
      if (publicRes.ok) {
        const count = publicData.products?.length || publicData.length || 0
        updateResult("Public Products", "success", `Found ${count} public product(s)`, publicData)
      } else {
        updateResult("Public Products", "error", "Failed to fetch public products", publicData)
      }
    } catch (error) {
      updateResult("Public Products", "error", `Error: ${error}`)
    }

    setTesting(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold">API Diagnostics</h1>
          <p className="mt-2 text-muted-foreground">Comprehensive test of all API endpoints to identify issues</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>How to use this page</AlertTitle>
          <AlertDescription>
            Click "Run All Tests" to check all API endpoints. This will show you exactly what's working and what's
            broken. Make sure you're logged in first.
          </AlertDescription>
        </Alert>

        <Button onClick={runAllTests} disabled={testing} size="lg" className="w-full">
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            "Run All Tests"
          )}
        </Button>

        <div className="grid gap-4">
          {results.map((result) => (
            <Card key={result.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    {result.name}
                  </CardTitle>
                  <span
                    className={`text-sm font-medium ${
                      result.status === "success"
                        ? "text-green-500"
                        : result.status === "error"
                          ? "text-red-500"
                          : "text-blue-500"
                    }`}
                  >
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <CardDescription>{result.message}</CardDescription>
              </CardHeader>
              {result.data && (
                <CardContent>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="mb-2 text-sm font-semibold">Response Data:</p>
                    <pre className="overflow-auto text-xs max-h-64">{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {results.length > 0 && !testing && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold text-green-500">
                    {results.filter((r) => r.status === "success").length}
                  </span>{" "}
                  tests passed
                </p>
                <p>
                  <span className="font-semibold text-red-500">
                    {results.filter((r) => r.status === "error").length}
                  </span>{" "}
                  tests failed
                </p>
                <p>
                  <span className="font-semibold text-blue-500">
                    {results.filter((r) => r.status === "pending").length}
                  </span>{" "}
                  tests pending
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
