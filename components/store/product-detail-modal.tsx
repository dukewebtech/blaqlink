"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Minus, Plus, ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react"
import { cartStore } from "@/lib/cart-store"

interface Product {
  id: string
  title: string
  price: number
  images: string[]
  product_type: string
  category: string
  description: string
  stock_quantity?: number
}

interface ProductDetailModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  storeName?: string
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  storeName = "Store Owner",
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    setCurrentImageIndex(0)
    setQuantity(1)
  }, [product?.id])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [open, onOpenChange])

  if (!product || !open) return null

  const hasMultipleImages = product.images && product.images.length > 1

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  const handleAddToCart = () => {
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
    onOpenChange(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[90vw] h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="grid grid-cols-[55%_45%] h-full">
          {/* Image Section - Left Side */}
          <div className="relative bg-gray-50 flex flex-col">
            {/* Main Image */}
            <div className="flex-1 relative flex items-center justify-center p-8">
              {product.images?.[currentImageIndex] ? (
                <img
                  src={product.images[currentImageIndex] || "/placeholder.svg"}
                  alt={product.title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center text-muted-foreground text-xl">No Image Available</div>
              )}

              {/* Image Navigation Arrows */}
              {hasMultipleImages && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full shadow-xl h-12 w-12 hover:scale-110 transition-transform"
                    onClick={handlePreviousImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full shadow-xl h-12 w-12 hover:scale-110 transition-transform"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>

                  {/* Image Indicators */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex ? "bg-white w-8" : "bg-white/50 w-2"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {hasMultipleImages && (
              <div className="p-6 border-t bg-white flex gap-3 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      index === currentImageIndex ? "border-purple-600 ring-2 ring-purple-200" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Section - Right Side */}
          <div className="p-12 overflow-y-auto flex flex-col">
            <div className="space-y-6 flex-1">
              {/* Title and Seller */}
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-balance leading-tight">{product.title}</h2>
                <p className="text-base text-gray-500">By {storeName}</p>
              </div>

              {/* Description */}
              {product.description && <p className="text-base text-gray-700 leading-relaxed">{product.description}</p>}

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="text-base text-gray-500 block">How Many</label>
                <div className="inline-flex items-center gap-0 border border-gray-300 rounded-full overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-none hover:bg-gray-50"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-normal w-16 text-center border-x border-gray-300">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-none hover:bg-gray-50"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={product.stock_quantity ? quantity >= product.stock_quantity : false}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <p className="text-base text-gray-500">Price</p>
                <p className="text-3xl font-bold">NGN {Number(product.price).toLocaleString()}</p>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-4">
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-base bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-medium"
                    onClick={handleAddToCart}
                  >
                    Add to bag
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-14 px-6 text-base text-gray-600 hover:bg-gray-50 rounded-lg font-normal gap-2"
                  >
                    <Heart className="h-5 w-5" />
                    Contact Seller
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Stock Info */}
                {product.stock_quantity !== undefined && (
                  <p className="text-sm text-gray-500">
                    {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
