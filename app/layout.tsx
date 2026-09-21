import type React from "react"
import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Fraunces, Inter, Space_Grotesk, Playfair_Display, Work_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
})

// Storefront-only font pairings (see lib/storefront/fonts.ts) — the internal
// Blaqora dashboard UI keeps using Bricolage Grotesque + Plus Jakarta Sans above.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: "Blaqora - All-in-One SaaS E-Commerce Platform",
  description: "Get paid early and save automatically. All-in-one e-commerce platform to sell products, services, and digital goods. Join 10K+ sellers in 150+ countries.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${bricolageGrotesque.variable} ${plusJakartaSans.variable} ${fraunces.variable} ${inter.variable} ${spaceGrotesk.variable} ${playfairDisplay.variable} ${workSans.variable}`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
