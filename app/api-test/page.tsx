"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Info, Database } from "lucide-react"

export default function APITestPage() {
  const [loginEmail, setLoginEmail] = useState("test@example.com")
  const [loginPassword, setLoginPassword] = useState("password123")
  const [loginResult, setLoginResult] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupName, setSignupName] = useState("")
  const [signupResult, setSignupResult] = useState("")
  const [signupLoading, setSignupLoading] = useState(false)

  const [productTitle, setProductTitle] = useState("Test Product")
  const [productPrice, setProductPrice] = useState("99.99")
  const [productResult, setProductResult] = useState("")
  const [productLoading, setProductLoading] = useState(false)

  const [productsResult, setProductsResult] = useState("")
  const [productsLoading, setProductsLoading] = useState(false)

  const [usersResult, setUsersResult] = useState("")
  const [usersLoading, setUsersLoading] = useState(false)

  const [allProductsResult, setAllProductsResult] = useState("")
  const [allProductsLoading, setAllProductsLoading] = useState(false)
  const [productTypeFilter, setProductTypeFilter] = useState<string | null>(null)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  const testLogin = async () => {
    setLoginLoading(true)
    setLoginResult("Testing...")
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await response.json()
      if (!response.ok && data.error === "Invalid login credentials") {
        setLoginResult(
          JSON.stringify(
            {
              error: "Invalid login credentials",
              message:
                "The email or password is incorrect. Please check your credentials or sign up first if you don't have an account.",
              hint: "Go to the 'Sign Up' tab to create a new account",
            },
            null,
            2,
          ),
        )
      } else {
        setLoginResult(JSON.stringify(data, null, 2))
      }
    } catch (error) {
      setLoginResult(`Error: ${error}`)
    }
    setLoginLoading(false)
  }

  const testSignup = async () => {
    setSignupLoading(true)
    setSignupResult("Testing...")
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          fullName: signupName,
          role: "vendor",
        }),
      })
      const data = await response.json()
      setSignupResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setSignupResult(`Error: ${error}`)
    }
    setSignupLoading(false)
  }

  const testCreateProduct = async () => {
    setProductLoading(true)
    setProductResult("Testing...")
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_type: "physical",
          title: productTitle,
          description: "Test product description",
          price: Number.parseFloat(productPrice),
          category: "clothing",
          sku: "TEST-001",
          stock_quantity: 10,
        }),
      })
      const data = await response.json()
      setProductResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setProductResult(`Error: ${error}`)
    }
    setProductLoading(false)
  }

  const testGetProducts = async () => {
    setProductsLoading(true)
    setProductsResult("Testing...")
    try {
      const response = await fetch("/api/products")
      const data = await response.json()
      setProductsResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setProductsResult(`Error: ${error}`)
    }
    setProductsLoading(false)
  }

  const testGetUsers = async () => {
    setUsersLoading(true)
    setUsersResult("Loading...")
    try {
      const response = await fetch("/api/users")
      const data = await response.json()
      setUsersResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setUsersResult(`Error: ${error}`)
    }
    setUsersLoading(false)
  }

  const testViewAllProducts = async (type?: string | null) => {
    setAllProductsLoading(true)
    setAllProductsResult("Loading...")
    try {
      const url = type ? `/api/products?type=${type}` : "/api/products"
      const response = await fetch(url)
      const data = await response.json()

      if (data.products && data.products.length > 0) {
        const filterText = type ? ` (${type} products)` : ""
        setAllProductsResult(
          `Found ${data.products.length} product(s)${filterText}:\n\n` + JSON.stringify(data.products, null, 2),
        )
      } else {
        const filterText = type ? ` of type "${type}"` : ""
        setAllProductsResult(`No products found${filterText}. Create one using the 'Create Product' tab!`)
      }
    } catch (error) {
      setAllProductsResult(`Error: ${error}`)
    }
    setAllProductsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold">API Test Page</h1>
          <p className="mt-2 text-xs md:text-base text-muted-foreground">Test your API endpoints directly from the browser</p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Getting Started</AlertTitle>
          <AlertDescription>
            <ol className="mt-2 space-y-1 list-decimal list-inside text-sm">
              <li>
                <strong>Check Database</strong> - See if any users exist (Database tab)
              </li>
              <li>
                <strong>Sign Up</strong> - Create a new account (Sign Up tab)
              </li>
              <li>
                <strong>Verify Email</strong> - Check your email and click the verification link
              </li>
              <li>
                <strong>Login</strong> - Use your credentials to log in (Login tab)
              </li>
              <li>
                <strong>Create Products</strong> - Start adding products to your store
              </li>
              <li>
                <strong>View All Products</strong> - See all products in your database (View All Products tab)
              </li>
            </ol>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Your API Base URL</CardTitle>
            <CardDescription>Use this URL in Postman if needed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm">{baseUrl}</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Copy this URL and add the endpoint path (e.g., /api/auth/login)
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="create-product">Create Product</TabsTrigger>
            <TabsTrigger value="get-products">Get Products</TabsTrigger>
            <TabsTrigger value="view-products">View All Products</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-4">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>Database Viewer</AlertTitle>
              <AlertDescription>
                Check if users exist in your database. If you just signed up, you should see your account here (even
                before email verification).
              </AlertDescription>
            </Alert>
            <Card>
              <CardHeader>
                <CardTitle>View Registered Users</CardTitle>
                <CardDescription>GET /api/users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={testGetUsers} disabled={usersLoading} className="w-full">
                  {usersLoading ? "Loading..." : "View All Users"}
                </Button>
                {usersResult && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="mb-2 font-semibold">Database Response:</p>
                    <pre className="overflow-auto text-xs">{usersResult}</pre>
                  </div>
                )}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    If you see your email here but still can't log in, check your email inbox for the verification link
                    from Supabase. You must verify your email before logging in.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Start Here!</AlertTitle>
              <AlertDescription>
                Create your account first. You'll receive a verification email from Supabase. Click the link in the
                email to verify your account before logging in.
              </AlertDescription>
            </Alert>
            <Card>
              <CardHeader>
                <CardTitle>Test Sign Up</CardTitle>
                <CardDescription>POST /api/auth/signup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password (min 6 characters)</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button onClick={testSignup} disabled={signupLoading} className="w-full">
                  {signupLoading ? "Testing..." : "Test Sign Up"}
                </Button>
                {signupResult && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="mb-2 font-semibold">Response:</p>
                    <pre className="overflow-auto text-xs">{signupResult}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="login" className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                You must sign up and verify your email before you can log in. If you get "Invalid credentials" error, go
                to the Sign Up tab first.
              </AlertDescription>
            </Alert>
            <Card>
              <CardHeader>
                <CardTitle>Test Login</CardTitle>
                <CardDescription>POST /api/auth/login</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <Button onClick={testLogin} disabled={loginLoading} className="w-full">
                  {loginLoading ? "Testing..." : "Test Login"}
                </Button>
                {loginResult && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="mb-2 font-semibold">Response:</p>
                    <pre className="overflow-auto text-xs">{loginResult}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-product" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Create Product</CardTitle>
                <CardDescription>POST /api/products</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-title">Product Title</Label>
                  <Input id="product-title" value={productTitle} onChange={(e) => setProductTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-price">Price</Label>
                  <Input
                    id="product-price"
                    type="number"
                    step="0.01"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                  />
                </div>
                <Button onClick={testCreateProduct} disabled={productLoading} className="w-full">
                  {productLoading ? "Testing..." : "Test Create Product"}
                </Button>
                {productResult && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="mb-2 font-semibold">Response:</p>
                    <pre className="overflow-auto text-xs">{productResult}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="get-products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Get Products</CardTitle>
                <CardDescription>GET /api/products</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={testGetProducts} disabled={productsLoading} className="w-full">
                  {productsLoading ? "Testing..." : "Test Get Products"}
                </Button>
                {productsResult && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="mb-2 font-semibold">Response:</p>
                    <pre className="overflow-auto text-xs">{productsResult}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="view-products" className="space-y-4">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>Product Database Viewer</AlertTitle>
              <AlertDescription>
                View all products or filter by product type (digital, physical, event, appointment). This shows you
                what's actually stored in your database!
              </AlertDescription>
            </Alert>
            <Card>
              <CardHeader>
                <CardTitle>View All Products</CardTitle>
                <CardDescription>GET /api/products - Filter by product type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Filter by Product Type:</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={productTypeFilter === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setProductTypeFilter(null)
                        testViewAllProducts(null)
                      }}
                      disabled={allProductsLoading}
                    >
                      All Products
                    </Button>
                    <Button
                      variant={productTypeFilter === "digital" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setProductTypeFilter("digital")
                        testViewAllProducts("digital")
                      }}
                      disabled={allProductsLoading}
                    >
                      Digital Products
                    </Button>
                    <Button
                      variant={productTypeFilter === "physical" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setProductTypeFilter("physical")
                        testViewAllProducts("physical")
                      }}
                      disabled={allProductsLoading}
                    >
                      Physical Products
                    </Button>
                    <Button
                      variant={productTypeFilter === "event" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setProductTypeFilter("event")
                        testViewAllProducts("event")
                      }}
                      disabled={allProductsLoading}
                    >
                      Event Tickets
                    </Button>
                    <Button
                      variant={productTypeFilter === "appointment" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setProductTypeFilter("appointment")
                        testViewAllProducts("appointment")
                      }}
                      disabled={allProductsLoading}
                    >
                      Appointments
                    </Button>
                  </div>
                </div>

                {allProductsResult && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="mb-2 font-semibold">Products in Database:</p>
                    <pre className="overflow-auto text-xs max-h-96">{allProductsResult}</pre>
                  </div>
                )}
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Click any filter button to see products of that type. Your "Product managament Ebook" is a digital
                    product, so it will appear when you click "Digital Products"!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Postman Examples</CardTitle>
            <CardDescription>Copy these for external testing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 font-semibold">Login:</p>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
                {`POST ${baseUrl}/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}`}
              </pre>
            </div>
            <div>
              <p className="mb-2 font-semibold">Create Product:</p>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
                {`POST ${baseUrl}/api/products
Content-Type: application/json

{
  "product_type": "physical",
  "title": "Test Product",
  "description": "Test description",
  "price": 99.99,
  "category": "clothing",
  "sku": "TEST-001",
  "stock_quantity": 10
}`}
              </pre>
            </div>
            <div>
              <p className="mb-2 font-semibold">Get Products by Type:</p>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
                {`GET ${baseUrl}/api/products?type=digital
GET ${baseUrl}/api/products?type=physical
GET ${baseUrl}/api/products?type=event
GET ${baseUrl}/api/products?type=appointment`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
