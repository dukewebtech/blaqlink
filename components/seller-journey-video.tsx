'use client'

import { useEffect, useRef, useState } from 'react'

export function SellerJourneyVideo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  return (
    <section className="w-full bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div 
          ref={containerRef}
          className="rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-600 to-blue-800 aspect-video relative"
        >
          <canvas
            ref={(canvas) => {
              if (!canvas || !isClient) return

              const ctx = canvas.getContext('2d')
              if (!ctx) return

              const width = 1280
              const height = 720
              canvas.width = width
              canvas.height = height

              let frameCount = 0
              const totalFrames = 300 // ~12.5 seconds at 24fps
              const fps = 24

              const animate = () => {
                frameCount++
                if (frameCount > totalFrames) frameCount = 0

                // Clear canvas
                ctx.fillStyle = '#0052CC'
                ctx.fillRect(0, 0, width, height)

                const progress = frameCount / totalFrames

                // Scene 1: Login (0-0.2)
                if (progress < 0.2) {
                  const sceneProgress = progress / 0.2
                  const opacity = Math.min(sceneProgress * 2, 1)

                  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
                  ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.textAlign = 'center'
                  ctx.fillText('Welcome to Blaqora', width / 2, height / 2 - 60)

                  ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.fillText('👤', width / 2, height / 2 + 40)
                }

                // Scene 2: Dashboard (0.2-0.4)
                if (progress >= 0.2 && progress < 0.4) {
                  const sceneProgress = (progress - 0.2) / 0.2
                  const opacity = Math.min(sceneProgress * 2, 1)

                  // Dashboard card
                  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
                  ctx.fillRect(width / 2 - 200, height / 2 - 120, 400, 240)

                  ctx.fillStyle = '#0052CC'
                  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.textAlign = 'left'
                  ctx.fillText('Your Dashboard', width / 2 - 180, height / 2 - 90)

                  // Stats
                  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.fillText('1,240', width / 2 - 160, height / 2 - 20)
                  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.fillStyle = '#6B7280'
                  ctx.fillText('Total Orders', width / 2 - 160, height / 2 + 10)

                  ctx.fillStyle = '#0052CC'
                  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.fillText('₦2.4M', width / 2 + 40, height / 2 - 20)
                  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.fillStyle = '#6B7280'
                  ctx.fillText('Revenue', width / 2 + 40, height / 2 + 10)
                }

                // Scene 3: Add Service (0.4-0.6)
                if (progress >= 0.4 && progress < 0.6) {
                  const sceneProgress = (progress - 0.4) / 0.2
                  const opacity = Math.min(sceneProgress * 2, 1)

                  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
                  ctx.fillRect(width / 2 - 200, height / 2 - 120, 400, 240)

                  ctx.fillStyle = '#0052CC'
                  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.textAlign = 'left'
                  ctx.fillText('Add Your Service', width / 2 - 180, height / 2 - 90)

                  ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.fillText('📝 Premium Web Design', width / 2 - 160, height / 2 - 30)
                  ctx.fillText('💰 ₦45,000', width / 2 - 160, height / 2 + 20)

                  ctx.fillStyle = '#FFEB3B'
                  ctx.fillRect(width / 2 - 160, height / 2 + 50, 320, 40)
                  ctx.fillStyle = '#0052CC'
                  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.textAlign = 'center'
                  ctx.fillText('Publish Service →', width / 2, height / 2 + 73)
                }

                // Scene 4: Order Received (0.6-0.8)
                if (progress >= 0.6 && progress < 0.8) {
                  const sceneProgress = (progress - 0.6) / 0.2
                  const opacity = Math.min(sceneProgress * 2, 1)

                  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
                  ctx.fillRect(width / 2 - 200, height / 2 - 120, 400, 240)

                  ctx.fillStyle = '#0052CC'
                  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.textAlign = 'left'
                  ctx.fillText('New Order! 🎉', width / 2 - 180, height / 2 - 90)

                  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.fillStyle = '#6B7280'
                  ctx.fillText('Order ID', width / 2 - 160, height / 2 - 30)

                  ctx.fillStyle = '#0052CC'
                  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.fillText('#ORD-2847', width / 2 - 160, height / 2 + 5)

                  ctx.fillStyle = '#10B981'
                  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.fillText('✓ Payment Confirmed', width / 2 - 160, height / 2 + 50)
                }

                // Scene 5: Service Delivered (0.8-1.0)
                if (progress >= 0.8) {
                  const sceneProgress = (progress - 0.8) / 0.2
                  const opacity = Math.min(sceneProgress * 2, 1)

                  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
                  ctx.fillRect(width / 2 - 200, height / 2 - 100, 400, 200)

                  ctx.fillStyle = '#0052CC'
                  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.textAlign = 'center'
                  ctx.fillText('Service Delivered ✓', width / 2, height / 2 - 60)

                  ctx.font = '48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.fillText('😊', width / 2, height / 2 + 10)

                  ctx.fillStyle = '#FFEB3B'
                  ctx.fillRect(width / 2 - 150, height / 2 + 40, 300, 40)
                  ctx.fillStyle = '#000'
                  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  ctx.fillText('Ready to scale? Start earning today', width / 2, height / 2 + 63)
                }

                requestAnimationFrame(animate)
              }

              animate()
            }}
            className="w-full h-full"
          />
        </div>
      </div>
    </section>
  )
}
