"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ShoppingCart, Heart, User, Star, ArrowLeft } from "lucide-react"
import Link from "next/link"

const categories = [
  { name: "Great Hair Care", image: "/hair-care-products.png" },
  { name: "Body Care Kits", image: "/body-care-kit.jpg" },
  { name: "Hands", image: "/nourishing-hand-cream.png" },
  { name: "Refills & Kits", image: "/refill-bottles.jpg" },
  { name: "New Kits", image: "/beauty-gift-set.png" },
  { name: "Gifts", image: "/gift-box-beauty.jpg" },
]

const products = [
  {
    id: 1,
    name: "Vitamin E Moisture Day Cream",
    price: 28.0,
    rating: 4.5,
    reviews: 234,
    image:
      "https://www.thebodyshop.com/cdn/shop/files/1026966_VITAMIN_E_DAY_CREAM_50ML_BRONZE_INAEHPS063_d99cc21f-6d8d-48d2-880f-4fb28cc8e015.jpg?v=1758292355&width=400",
  },
  {
    id: 2,
    name: "Sugar Pumpkin Body Butter",
    price: 24.0,
    rating: 4.8,
    reviews: 567,
    image:
      "https://www.thebodyshop.com/cdn/shop/files/1047170_PUMPKIN_BODY_BUTTER_200ML_A0X_FRONT_INAJQPS035.jpg?v=1754916869&width=400",
  },
  {
    id: 3,
    name: "Pumpkin Bath & Shower Cream",
    price: 18.0,
    rating: 4.6,
    reviews: 189,
    image:
      "https://www.thebodyshop.com/cdn/shop/files/1047067_PUMPKIN_BATH_SHOWER_CREAM_250ML_A0X_FRONT_INAJQPS031.jpg?v=1754916803&width=400",
  },
  {
    id: 4,
    name: "Ginger Scalp Care Conditioner",
    price: 22.0,
    rating: 4.7,
    reviews: 423,
    image:
      "https://www.thebodyshop.com/cdn/shop/files/1042574_GINGER_SCALP_CARE_CONDITIONER_400ML_BRONZE_INAGRPS302.jpg?v=1744808504&width=400",
  },
]

const bundles = [
  {
    id: 1,
    name: "Pumpkin Spice Collection",
    description: "Get ready for autumn with our iconic pumpkin range",
    price: 65.0,
    originalPrice: 85.0,
    discount: 15,
    image:
      "https://www.thebodyshop.com/cdn/shop/files/BUNDLE_1047067_1047170_1047169_1046939_2025_Q3_PUMPKIN_BUNDLE1_4productsnomistcopy.jpg?v=1758620174&width=400",
  },
  {
    id: 2,
    name: "Sugarplum Passion Essentials",
    description: "Complete skin and body care with delightful plum scent",
    price: 72.0,
    originalPrice: 90.0,
    discount: 15,
    image: "https://www.thebodyshop.com/cdn/shop/files/SugarplumPassionUltimateCollection.jpg?v=1759858622&width=400",
  },
  {
    id: 3,
    name: "Vitamin C Glow Up Edit",
    description: "Brighten and energize your skin with vitamin C",
    price: 58.0,
    originalPrice: 75.0,
    discount: 15,
    image:
      "https://www.thebodyshop.com/cdn/shop/files/BUNDLE_1019259_1027762_1027752_VITC_GLOW_UP_EDIT_INAIYPS025_c819085e-529f-4d68-b17c-e710cbfaaeee.jpg?v=1744298173&width=400",
  },
  {
    id: 4,
    name: "Pumpkin Trio Bundle",
    description: "Three essential pumpkin products for complete care",
    price: 55.0,
    originalPrice: 68.0,
    discount: 15,
    image:
      "https://www.thebodyshop.com/cdn/shop/files/BUNDLE_1047067_1047170_1047169_2025_Q3_PUMPKIN_BUNDLE1_3productscopy_af630641-6aaf-4671-aa95-2bceb89a1abc.jpg?v=1754643240&width=400",
  },
]

const scalpProducts = [
  {
    id: 1,
    name: "Anti-Dandruff Tea Tree Kit",
    price: 45.0,
    rating: 4.6,
    reviews: 312,
    description: "Our complete 3-item tea tree set",
    image: "/tea-tree-shampoo-bottles-set.jpg",
  },
  {
    id: 2,
    name: "Ginger Scalp Serum",
    price: 28.0,
    rating: 4.7,
    reviews: 198,
    description: "Nourish and soothe your scalp with ginger",
    image: "/ginger-scalp-serum-bottle.jpg",
  },
]

export default function BeautyEssentialsTemplate() {
  const [activeTab, setActiveTab] = useState("bestsellers")

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner */}
      <div className="bg-emerald-600 text-white text-center py-2 text-sm font-medium">
        BOXING DAY SALE UP TO 50% OFF
      </div>

      {/* Navigation */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/templates"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Templates</span>
            </Link>
            <div className="flex items-center gap-6">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-10 w-64 bg-muted/50" />
              </div>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  2
                </Badge>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-100 to-pink-200 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
              <Badge className="bg-emerald-600 hover:bg-emerald-700">NEW ARRIVAL</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Captured screenshot
              </h1>
              <p className="text-lg text-muted-foreground text-pretty">
                Our iconic range now includes a NEW Barrier Boost Cream. It's hydration, perfected.
              </p>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                SHOP NOW
              </Button>
            </div>
            <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-200">
              <img src="/skincare-products-pink-background.jpg" alt="Hero products" className="w-full h-auto rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Cruelty-Free Skincare, Body & Beauty Products</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <button
                key={category.name}
                className="group flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-center">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products We Love */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Products we love</h2>
          <div className="flex justify-center gap-4 mb-12">
            <Button
              variant={activeTab === "bestsellers" ? "default" : "ghost"}
              onClick={() => setActiveTab("bestsellers")}
              className="transition-all duration-300"
            >
              BESTSELLERS
            </Button>
            <Button
              variant={activeTab === "special" ? "default" : "ghost"}
              onClick={() => setActiveTab("special")}
              className="transition-all duration-300"
            >
              SPECIAL EDITIONS
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <Card
                key={product.id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">({product.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">${product.price.toFixed(2)}</span>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      Add to Bag
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Save 15% Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Save 15% on your favourite collections</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {bundles.map((bundle, index) => (
              <Card
                key={bundle.id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Badge className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 hover:bg-yellow-500 z-10">
                    SAVE {bundle.discount}%
                  </Badge>
                  <img
                    src={bundle.image || "/placeholder.svg"}
                    alt={bundle.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm line-clamp-2">{bundle.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{bundle.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">${bundle.price.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${bundle.originalPrice.toFixed(2)}
                    </span>
                  </div>
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Add to Bag
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Scalp Soothers */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12">The itchy scalp soothers</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {scalpProducts.map((product, index) => (
              <Card
                key={product.id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-left"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="grid md:grid-cols-2 gap-6 p-6">
                  <div className="aspect-square overflow-hidden bg-muted rounded-lg">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex flex-col justify-center space-y-4">
                    <Badge className="w-fit bg-yellow-400 text-yellow-900 hover:bg-yellow-500">BESTSELLER</Badge>
                    <h3 className="text-xl font-bold">{product.name}</h3>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-1">({product.reviews})</span>
                    </div>
                    <p className="text-muted-foreground">{product.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">Add to Bag</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links Footer */}
      <section className="py-12 border-t">
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-bold mb-6">Quick Links</h3>
          <div className="flex flex-wrap gap-3">
            {["Find a Store", "Order Status", "Shopping Help", "Returns", "Your Saves"].map((link) => (
              <Button key={link} variant="outline" className="rounded-full bg-transparent">
                {link}
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
