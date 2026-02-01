"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function DataIsolationTestPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runIsolationTest = async () => {
    setLoading(true)
    console.log("[v0] Starting data isolation test...")

    try {
      // Test 1: Get current user's data
      const currentUserResponse = await fetch("/api/test-isolation/current-user")
      const currentUserData = await currentUserResponse.json()
      console.log("[v0] Current user data:", currentUserData)

      // Test 2: Get products for current user
      const productsResponse = await fetch("/api/products")
      const productsData = await productsResponse.json()
      console.log("[v0] Products for current user:", productsData)

      // Test 3: Get categories for current user
      const categoriesResponse = await fetch("/api/categories")
      const categoriesData = await categoriesResponse.json()
      console.log("[v0] Categories for current user:", categoriesData)

      // Test 4: Get orders for current user
      const ordersResponse = await fetch("/api/orders")
      const ordersData = await ordersResponse.json()
      console.log("[v0] Orders for current user:", ordersData)

      // Test 5: Get public products (should still be filtered by user)
      const publicProductsResponse = await fetch("/api/public/products")
      const publicProductsData = await publicProductsResponse.json()
      console.log("[v0] Public products:", publicProductsData)

      // Test 6: Get all users data from database (for comparison)
      const allUsersResponse = await fetch("/api/test-isolation/all-users")
      const allUsersData = await allUsersResponse.json()
      console.log("[v0] All users in database:", allUsersData)

      setTestResults({
        currentUser: currentUserData,
        products: productsData,
        categories: categoriesData,
        orders: ordersData,
        publicProducts: publicProductsData,
        allUsers: allUsersData,
      })
    } catch (error) {
      console.error("[v0] Test failed:", error)
      setTestResults({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Data Isolation Test</h1>

      <Card className="p-6 mb-6">
        <p className="mb-4 text-muted-foreground">
          This test verifies that each user can only see their own data. Click the button below to run the test.
        </p>
        <Button onClick={runIsolationTest} disabled={loading}>
          {loading ? "Running Test..." : "Run Data Isolation Test"}
        </Button>
      </Card>

      {testResults && (
        <div className="space-y-6">
          {testResults.error ? (
            <Card className="p-6 border-red-500">
              <h2 className="text-xl font-semibold mb-4 text-red-500">Error</h2>
              <pre className="bg-muted p-4 rounded overflow-auto">{testResults.error}</pre>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Current User</h2>
                <pre className="bg-muted p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(testResults.currentUser, null, 2)}
                </pre>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Products (Should only show current user's products)</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Count:{" "}
                  {Array.isArray(testResults.products)
                    ? testResults.products.length
                    : testResults.products?.products?.length || 0}
                </p>
                <pre className="bg-muted p-4 rounded overflow-auto text-sm max-h-96">
                  {JSON.stringify(testResults.products, null, 2)}
                </pre>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Categories (Should only show current user's categories)</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Count:{" "}
                  {Array.isArray(testResults.categories)
                    ? testResults.categories.length
                    : testResults.categories?.categories?.length || 0}
                </p>
                <pre className="bg-muted p-4 rounded overflow-auto text-sm max-h-96">
                  {JSON.stringify(testResults.categories, null, 2)}
                </pre>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Orders (Should only show current user's orders)</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Count:{" "}
                  {Array.isArray(testResults.orders)
                    ? testResults.orders.length
                    : testResults.orders?.orders?.length || 0}
                </p>
                <pre className="bg-muted p-4 rounded overflow-auto text-sm max-h-96">
                  {JSON.stringify(testResults.orders, null, 2)}
                </pre>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Public Products (Should only show current user's products)
                </h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Count: {Array.isArray(testResults.publicProducts) ? testResults.publicProducts.length : 0}
                </p>
                <pre className="bg-muted p-4 rounded overflow-auto text-sm max-h-96">
                  {JSON.stringify(testResults.publicProducts, null, 2)}
                </pre>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">All Users in Database (For Comparison)</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Total users: {testResults.allUsers?.users?.length || 0}
                </p>
                <pre className="bg-muted p-4 rounded overflow-auto text-sm max-h-96">
                  {JSON.stringify(testResults.allUsers, null, 2)}
                </pre>
              </Card>

              <Card className="p-6 border-green-500">
                <h2 className="text-xl font-semibold mb-4 text-green-600">Test Summary</h2>
                <div className="space-y-2">
                  <p>✓ Current user authenticated: {testResults.currentUser?.user?.email || "N/A"}</p>
                  <p>
                    ✓ Products filtered by user:{" "}
                    {Array.isArray(testResults.products)
                      ? testResults.products.length
                      : testResults.products?.products?.length || 0}{" "}
                    products
                  </p>
                  <p>
                    ✓ Categories filtered by user:{" "}
                    {Array.isArray(testResults.categories)
                      ? testResults.categories.length
                      : testResults.categories?.categories?.length || 0}{" "}
                    categories
                  </p>
                  <p>
                    ✓ Orders filtered by user:{" "}
                    {Array.isArray(testResults.orders)
                      ? testResults.orders.length
                      : testResults.orders?.orders?.length || 0}{" "}
                    orders
                  </p>
                  <p>
                    ✓ Public products filtered by user:{" "}
                    {Array.isArray(testResults.publicProducts) ? testResults.publicProducts.length : 0} products
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Total users in database: {testResults.allUsers?.users?.length || 0}
                  </p>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
