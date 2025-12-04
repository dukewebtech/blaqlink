"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ShoppingCart,
  Minus,
  Plus,
  Star,
  Truck,
  Shield,
  RefreshCw,
  Share2,
  Copy,
  Check,
  Facebook,
  Twitter,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cartStore } from "@/lib/cart-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Product {
  id: string
  title: string
  price: number
  images: string[]
  product_type: string
  category: string
  description: string
  stock_quantity?: number
  status: string
  event_date?: string
  event_location?: string
  duration_minutes?: number
  available_days?: string[]
  start_time?: string
  end_time?: string
}

interface StoreInfo {
  id: string
  business_name: string
  full_name: string
  location: string
  profile_image?: string
  store_logo_url?: string
  phone?: string
  email?: string
  store_template?: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const storeId = params.storeId as string
  const productId = params.productId as string

  const [product, setProduct] = useState<Product | null>(null)
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCartCount(cartStore.getItemCount())
    const handleCartUpdate = () => setCartCount(cartStore.getItemCount())
    window.addEventListener("cartUpdated", handleCartUpdate)
    return () => window.removeEventListener("cartUpdated", handleCartUpdate)
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch store info
        const storeRes = await fetch(`/api/public/store-info?storeId=${storeId}`)
        if (storeRes.ok) {
          const storeData = await storeRes.json()
          setStoreInfo(storeData)
        }

        // Fetch product
        const productRes = await fetch(`/api/public/products?storeId=${storeId}`)
        if (productRes.ok) {
          const productsData = await productRes.json()
          const productsArray = productsData.products || []
          const foundProduct = productsArray.find((p: Product) => p.id === productId)
          setProduct(foundProduct || null)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [storeId, productId])

  const handleAddToCart = () => {
    if (!product) return
    cartStore.addItem(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        product_type: product.product_type,
        images: product.images,
      },
      quantity,
    )
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.title} added to your cart`,
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(price)
  }

  const getThemeColors = () => {
    switch (storeInfo?.store_template) {
      case "obsidian-glass":
        return {
          bg: "bg-zinc-950",
          text: "text-zinc-100",
          accent: "from-violet-600 to-fuchsia-600",
          card: "bg-zinc-900/60 border-zinc-800/50",
          button: "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500",
        }
      case "aurora-frost":
        return {
          bg: "bg-gradient-to-br from-rose-50 via-amber-50/30 to-teal-50",
          text: "text-stone-800",
          accent: "from-rose-500 to-amber-500",
          card: "bg-white/50 border-white/60",
          button:
            "bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500 hover:from-rose-600 hover:via-amber-600 hover:to-teal-600",
        }
      case "crystal-clear":
        return {
          bg: "bg-gradient-to-br from-slate-50 via-white to-blue-50",
          text: "text-slate-800",
          accent: "from-blue-500 to-cyan-500",
          card: "bg-white/60 border-white/30",
          button: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
        }
      default:
        return {
          bg: "bg-background",
          text: "text-foreground",
          accent: "from-emerald-500 to-emerald-600",
          card: "bg-card border-border",
          button: "bg-emerald-600 hover:bg-emerald-700",
        }
    }
  }

  const theme = getThemeColors()

  const getProductUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href
    }
    return ""
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getProductUrl())
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleShareWhatsApp = () => {
    const text = `Check out ${product?.title} at ${storeInfo?.business_name}!\n${formatPrice(product?.price || 0)}\n\n${getProductUrl()}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getProductUrl())}`, "_blank")
  }

  const handleShareTwitter = () => {
    const text = `Check out ${product?.title} at ${storeInfo?.business_name}! ${formatPrice(product?.price || 0)}`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getProductUrl())}`,
      "_blank",
    )
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: `Check out ${product?.title} at ${storeInfo?.business_name}!`,
          url: getProductUrl(),
        })
      } catch (err) {
        // User cancelled or share failed
      }
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => router.push(`/store/${storeId}`)}>Back to Store</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${theme.card}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href={`/store/${storeId}`} className="flex items-center gap-3">
              {(storeInfo?.store_logo_url || storeInfo?.profile_image) && (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={storeInfo.store_logo_url || storeInfo.profile_image || "/placeholder.svg"}
                    alt={storeInfo?.business_name || "Store"}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <span className="text-xl font-bold">{storeInfo?.business_name}</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => router.push(`/store/${storeId}/cart`)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <button
          onClick={() => router.push(`/store/${storeId}`)}
          className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </button>
      </div>

      {/* Product Content */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
              <Image
                src={product.images?.[selectedImageIndex] || "/placeholder.svg"}
                alt={product.title}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-primary"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${product.title} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.product_type.charAt(0).toUpperCase() + product.product_type.slice(1)}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm opacity-70">(0 reviews)</span>
              </div>
              <p className="text-3xl font-bold">{formatPrice(product.price)}</p>
            </div>

            <div className="prose prose-sm max-w-none opacity-80">
              <p>{product.description}</p>
            </div>

            {/* Event/Appointment Details */}
            {product.product_type === "event" && product.event_date && (
              <div className={`p-4 rounded-xl ${theme.card} backdrop-blur-xl border`}>
                <h3 className="font-semibold mb-2">Event Details</h3>
                <p className="text-sm opacity-80">
                  Date:{" "}
                  {new Date(product.event_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {product.event_location && <p className="text-sm opacity-80">Location: {product.event_location}</p>}
              </div>
            )}

            {/* Quantity Selector */}
            {product.product_type === "physical" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  {product.stock_quantity && (
                    <span className="text-sm opacity-70 ml-4">{product.stock_quantity} in stock</span>
                  )}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex gap-3">
              <Button className={`flex-1 h-12 text-white ${theme.button}`} onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.product_type === "digital"
                  ? "Buy Now"
                  : product.product_type === "appointment"
                    ? "Book Now"
                    : product.product_type === "event"
                      ? "Get Ticket"
                      : "Add to Cart"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-12 w-12 bg-transparent">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleShareWhatsApp} className="cursor-pointer">
                    <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                    Share on WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareFacebook} className="cursor-pointer">
                    <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareTwitter} className="cursor-pointer">
                    <Twitter className="h-4 w-4 mr-2 text-sky-500" />
                    Share on X (Twitter)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </DropdownMenuItem>
                  {typeof navigator !== "undefined" && navigator.share && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
                        <Share2 className="h-4 w-4 mr-2" />
                        More Options...
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="h-6 w-6 opacity-70" />
                <span className="text-xs opacity-70">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Shield className="h-6 w-6 opacity-70" />
                <span className="text-xs opacity-70">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RefreshCw className="h-6 w-6 opacity-70" />
                <span className="text-xs opacity-70">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-8 ${theme.card}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm opacity-70">
            © {new Date().getFullYear()} {storeInfo?.business_name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
