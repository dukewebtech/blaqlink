import type React from "react"
import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google"
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
      <body className={`font-sans ${bricolageGrotesque.variable} ${plusJakartaSans.variable}`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
