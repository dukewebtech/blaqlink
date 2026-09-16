"use client"

import { useCallback, useState } from "react"
import { StoreLinkProvider } from "@/components/home/store-link-context"
import { SiteNav } from "@/components/home/site-nav"
import { Hero } from "@/components/home/hero"
import { Marquee } from "@/components/home/marquee"
import { UseCaseTabs, type UseCaseTab } from "@/components/home/use-case-tabs"
import { HowItWorks } from "@/components/home/how-it-works"
import { BentoGrid } from "@/components/home/bento-grid"
import { MoneyFlow } from "@/components/home/money-flow"
import { Pricing } from "@/components/home/pricing"
import { Mission } from "@/components/home/mission"
import { Faq } from "@/components/home/faq"
import { FinalCta } from "@/components/home/final-cta"
import { Footer } from "@/components/home/footer"

export default function Home() {
  const [activeTab, setActiveTab] = useState<UseCaseTab>("tickets")

  const handleTabLink = useCallback((tab: string) => {
    setActiveTab(tab as UseCaseTab)
    document.getElementById("sell")?.scrollIntoView({ block: "start" })
  }, [])

  return (
    <StoreLinkProvider>
      <SiteNav onTabLink={handleTabLink} />
      <main id="main">
        <Hero />
        <Marquee />
        <UseCaseTabs active={activeTab} onChange={setActiveTab} />
        <HowItWorks />
        <BentoGrid />
        <MoneyFlow />
        <Pricing />
        <Mission />
        <Faq />
        <FinalCta />
      </main>
      <Footer onTabLink={handleTabLink} />
    </StoreLinkProvider>
  )
}
