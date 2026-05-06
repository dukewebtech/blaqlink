"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Users,
  TrendingUp,
  Smartphone,
  Globe,
  ShoppingBag,
  Zap,
  Shield,
  CheckCircle2,
  Star,
  Menu,
  X,
  ChevronRight,
  Package,
  CreditCard,
  LineChart,
} from "lucide-react"

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const features = [
  {
    icon: Globe,
    title: "Your own store link",
    desc: "Get a unique storefront URL you can share anywhere. No coding, no hosting headaches.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: CreditCard,
    title: "Accept payments instantly",
    desc: "Receive payments from customers anywhere in Nigeria. Fast, secure, and reliable.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Package,
    title: "Manage inventory",
    desc: "Track stock levels, get low-stock alerts, and manage products with ease.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Users,
    title: "Know your customers",
    desc: "See who's buying, how often, and how much. Build real relationships.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: LineChart,
    title: "Sales analytics",
    desc: "Track revenue, top products, and growth trends from a clean dashboard.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Smartphone,
    title: "Mobile-first experience",
    desc: "Run your entire business from your phone. Manage orders on the go.",
    color: "bg-cyan-50 text-cyan-600",
  },
]

const steps = [
  { n: "01", title: "Create your account", desc: "Sign up for free in under 30 seconds. No credit card required." },
  { n: "02", title: "Add your products", desc: "Upload products, services, or digital goods. Set your price and go live." },
  { n: "03", title: "Share & get paid", desc: "Share your store link, receive orders, and get paid directly." },
]

const testimonials = [
  {
    quote: "Blaqora made it so easy to launch my fashion store. I was selling within the same day I signed up!",
    name: "Adaeze Okonkwo",
    role: "Fashion Boutique Owner",
    stars: 5,
    initials: "AO",
    bg: "bg-blue-500",
  },
  {
    quote: "The analytics are brilliant. I finally understand which products drive my revenue and which ones to drop.",
    name: "Emeka Nwachukwu",
    role: "Tech Accessories Seller",
    stars: 5,
    initials: "EN",
    bg: "bg-purple-500",
  },
  {
    quote: "My revenue grew 3x after switching to Blaqora. The storefront is beautiful and customers trust it.",
    name: "Fatima Aliyu",
    role: "Beauty Products Store",
    stars: 5,
    initials: "FA",
    bg: "bg-rose-500",
  },
]

const stats = [
  { value: "15K+", label: "Active Sellers" },
  { value: "₦2B+", label: "Total Sales Volume" },
  { value: "99.9%", label: "Uptime Guarantee" },
  { value: "24/7", label: "Customer Support" },
]

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ─── Navigation ──────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100" : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fillOpacity="0.9" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className={`font-bold text-xl tracking-tight transition-colors ${scrolled ? "text-slate-900" : "text-white"}`}>
              Blaqora
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it works", "Pricing", "Testimonials"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                  scrolled ? "text-slate-600" : "text-white/80"
                }`}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm font-medium transition-colors ${scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
              >
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-full bg-yellow-400 text-blue-950 hover:bg-yellow-300 font-semibold shadow-md shadow-yellow-200 px-5">
                Get started free
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
          style={{ background: "rgba(15,23,42,0.97)", backdropFilter: "blur(12px)" }}
        >
          <div className="px-5 py-4 space-y-1">
            {["Features", "How it works", "Pricing", "Testimonials"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-white/80 text-sm font-medium hover:text-white border-b border-white/5"
              >
                {item}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full rounded-full border-white/20 text-white hover:bg-white/10 bg-transparent">
                  Log in
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-full bg-yellow-400 text-blue-950 hover:bg-yellow-300 font-semibold">
                  Get started free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900">
        {/* Subtle background orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 py-20 lg:py-28 w-full">
          <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
            {/* Badge */}
            <div className="animate-fade-in inline-flex items-center gap-2 bg-blue-800/50 border border-blue-700/40 text-blue-200 text-xs font-semibold px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Trusted by 15,000+ Nigerian sellers
            </div>

            {/* Headline */}
            <h1 className="bq-fade-up bq-delay-1 text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Your online store,{" "}
              <span className="bq-shimmer-text">live in minutes</span>
            </h1>

            <p className="bq-fade-up bq-delay-2 text-lg sm:text-xl text-blue-200/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              Accept payments, manage orders, track customers, and grow your business — all from one powerful dashboard built for Nigerian sellers.
            </p>

            {/* CTAs */}
            <div className="bq-fade-up bq-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button className="h-14 px-8 rounded-full bg-yellow-400 text-blue-950 hover:bg-yellow-300 font-bold text-base shadow-xl shadow-yellow-400/25 transition-all hover:scale-105 hover:shadow-yellow-300/30 group">
                  Start selling for free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="ghost"
                  className="h-14 px-8 rounded-full text-white border border-white/20 hover:bg-white/10 font-medium text-base"
                >
                  See how it works
                </Button>
              </a>
            </div>

            {/* Trust line */}
            <p className="bq-fade-in bq-delay-5 mt-6 text-blue-400/60 text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Free to start · No credit card required · Cancel anytime
            </p>
          </div>

          {/* Dashboard cards mockup */}
          <div className="bq-scale-in bq-delay-4 relative mx-auto max-w-5xl">
            {/* Glow base */}
            <div className="absolute inset-x-16 bottom-0 h-16 bg-blue-500/20 blur-2xl rounded-full" />

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2 sm:px-0">
              {/* Card 1 – Store overview */}
              <div
                className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 text-white shadow-2xl bq-float"
                style={{ animationDelay: "0s" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Store Overview</span>
                  <span className="text-[10px] font-bold bg-green-400/20 text-green-300 px-2 py-0.5 rounded-full border border-green-400/30">Live</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[["Orders", "1,240"], ["Revenue", "₦2.4M"], ["Customers", "847"], ["Avg Order", "₦1,935"]].map(([lbl, val]) => (
                    <div key={lbl} className="bg-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-blue-300/70 mb-1">{lbl}</p>
                      <p className="text-lg font-bold">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2 – Sales chart */}
              <div
                className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 text-white shadow-2xl bq-float"
                style={{ animationDelay: "0.8s" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Sales This Month</span>
                  <span className="text-xs font-bold text-green-300 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +28%
                  </span>
                </div>
                <div className="h-24 flex items-end gap-1 mb-3">
                  {[32, 28, 45, 38, 50, 42, 68, 55, 72, 60, 80, 76].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all"
                      style={{
                        height: `${(h / 80) * 100}%`,
                        background: i === 11 ? "#fbbf24" : i > 8 ? "rgba(147,197,253,0.6)" : "rgba(147,197,253,0.25)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-blue-300/60">
                  <span>Jan</span><span>Jun</span><span>Dec</span>
                </div>
              </div>

              {/* Card 3 – Recent orders */}
              <div
                className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 text-white shadow-2xl bq-float"
                style={{ animationDelay: "1.6s" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Recent Orders</span>
                  <span className="text-[10px] text-blue-400 font-medium">View all →</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Chioma Obi", amount: "₦15,800", status: "Delivered", color: "bg-green-400/20 text-green-300" },
                    { name: "Tunde Ahmed", amount: "₦8,500", status: "Processing", color: "bg-yellow-400/20 text-yellow-300" },
                    { name: "Aisha Bello", amount: "₦22,000", status: "Delivered", color: "bg-green-400/20 text-green-300" },
                  ].map((o, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold">{o.name}</p>
                        <p className="text-[10px] text-blue-300/60 mt-0.5">{o.amount}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.color}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ─── Stats bar ────────────────────────────────────────────────── */}
      <section className="bg-white py-14 px-5 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <AnimatedSection key={s.label} delay={i * 100}>
                <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 mb-1">{s.value}</p>
                <p className="text-sm text-slate-500 font-medium">{s.label}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-5 sm:px-6 bg-slate-50">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-full">Features</span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Everything you need to sell
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Whether you sell products, services, or digital goods — Blaqora gives you the tools to run and scale your business with confidence.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 80}>
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5 sm:px-6 bg-white">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-full">How it works</span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">
              Start selling in 3 simple steps
            </h2>
          </AnimatedSection>

          <div className="relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

            <div className="grid md:grid-cols-3 gap-10 md:gap-8">
              {steps.map((s, i) => (
                <AnimatedSection key={s.n} delay={i * 150}>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-200 z-10 relative">
                        <span className="text-2xl font-extrabold text-white">{s.n}</span>
                      </div>
                      <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-blue-500 opacity-30 blur-lg" />
                    </div>
                    <h3 className="font-bold text-xl text-slate-900 mb-3">{s.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">{s.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>

          <AnimatedSection className="mt-14 text-center">
            <Link href="/signup">
              <Button className="h-13 px-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 font-semibold text-base shadow-lg shadow-blue-200 transition-all hover:scale-105 group">
                Create your store now
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Built-in tools / benefits ────────────────────────────────── */}
      <section className="py-24 px-5 sm:px-6 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left – stats panel */}
            <AnimatedSection>
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-5 mb-8">
                  {[
                    { n: "₦2B+", l: "Processed", icon: TrendingUp, c: "text-yellow-400" },
                    { n: "15K+", l: "Sellers", icon: Users, c: "text-blue-300" },
                    { n: "150+", l: "Product types", icon: Package, c: "text-green-300" },
                    { n: "99.9%", l: "Uptime", icon: Shield, c: "text-purple-300" },
                  ].map(({ n, l, icon: Icon, c }) => (
                    <div key={l} className="bg-white/5 rounded-2xl p-5 border border-white/10">
                      <Icon className={`w-6 h-6 mb-3 ${c}`} />
                      <p className={`text-2xl font-extrabold text-white mb-1`}>{n}</p>
                      <p className="text-xs text-blue-200/60">{l}</p>
                    </div>
                  ))}
                </div>
                {/* Mini chart */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <p className="text-xs text-blue-200/60 mb-3">Platform growth this year</p>
                  <div className="h-16 flex items-end gap-1">
                    {[20, 28, 22, 35, 30, 45, 40, 55, 50, 70, 65, 85].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${(h / 85) * 100}%`,
                          background: i === 11 ? "#fbbf24" : i > 8 ? "rgba(147,197,253,0.6)" : "rgba(147,197,253,0.2)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Right – copy */}
            <AnimatedSection delay={200}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
                Built-in tools that grow with your business
              </h2>
              <p className="text-blue-200/70 mb-8 text-lg leading-relaxed">
                From your first order to your thousandth, Blaqora scales effortlessly. We handle the technology so you can focus on selling.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Zap, title: "Instant setup", desc: "Your store is live in under 5 minutes, no technical skills needed." },
                  { icon: BarChart3, title: "Real-time analytics", desc: "Know exactly what's selling, who's buying, and where your money is." },
                  { icon: Shield, title: "Secure payments", desc: "Bank-grade encryption protects every transaction on your store." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-yellow-400/15 border border-yellow-400/30 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div>
                      <p className="font-bold text-white mb-1">{title}</p>
                      <p className="text-blue-200/60 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link href="/signup">
                  <Button className="h-13 px-8 rounded-full bg-yellow-400 text-blue-950 hover:bg-yellow-300 font-bold text-base shadow-xl shadow-yellow-400/25 transition-all hover:scale-105 group">
                    Get started for free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-5 sm:px-6 bg-slate-50">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-full">Testimonials</span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">
              Sellers love Blaqora
            </h2>
            <div className="flex justify-center gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-slate-500 text-sm font-medium">4.9/5 from 2,000+ reviews</span>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={t.name} delay={i * 120}>
                <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <div className="flex gap-1 mb-5">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 leading-relaxed flex-1 text-sm">"{t.quote}"</p>
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-100">
                    <div className={`w-10 h-10 ${t.bg} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-slate-400 text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-5 sm:px-6 bg-white">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-full">Pricing</span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">Start free, upgrade when you need more power.</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <AnimatedSection delay={100}>
              <div className="rounded-2xl border-2 border-slate-200 p-8 h-full flex flex-col hover:border-blue-200 transition-colors">
                <div className="mb-6">
                  <p className="font-bold text-slate-900 text-xl mb-1">Free</p>
                  <p className="text-slate-500 text-sm">Perfect to get started</p>
                  <p className="mt-4 text-4xl font-extrabold text-slate-900">₦0 <span className="text-base font-normal text-slate-400">/ month</span></p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {["1 storefront", "Up to 20 products", "Basic analytics", "Payment processing", "Email support"].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-slate-600 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="w-full rounded-full border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 font-semibold">
                    Get started free
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            {/* Pro */}
            <AnimatedSection delay={200}>
              <div className="rounded-2xl border-2 border-blue-600 p-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white h-full flex flex-col relative overflow-hidden shadow-xl shadow-blue-200">
                <div className="absolute top-5 right-5">
                  <span className="bg-yellow-400 text-blue-950 text-xs font-bold px-3 py-1 rounded-full">Most popular</span>
                </div>
                <div className="mb-6">
                  <p className="font-bold text-xl mb-1">Pro</p>
                  <p className="text-blue-200 text-sm">For growing businesses</p>
                  <p className="mt-4 text-4xl font-extrabold">₦4,999 <span className="text-base font-normal text-blue-300">/ month</span></p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {["Unlimited products", "Advanced analytics", "Custom store domain", "Priority support", "Team access", "Inventory alerts", "Bulk order management"].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-yellow-300 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button className="w-full rounded-full bg-yellow-400 text-blue-950 hover:bg-yellow-300 font-bold shadow-lg shadow-yellow-400/25 transition-all hover:scale-105">
                    Start Pro free trial
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-24 px-5 sm:px-6 bg-slate-50">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <div className="bg-gradient-to-br from-blue-950 to-blue-800 rounded-3xl p-12 sm:p-16 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.3),transparent)] pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-xs font-semibold px-4 py-2 rounded-full mb-6">
                <ShoppingBag className="w-3.5 h-3.5" />
                Join 15,000+ sellers on Blaqora
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
                Ready to start selling?
              </h2>
              <p className="text-blue-200/70 mb-8 text-lg max-w-lg mx-auto">
                Create your free store today. No credit card required. Your first sale could be minutes away.
              </p>
              <Link href="/signup">
                <Button className="h-14 px-10 rounded-full bg-yellow-400 text-blue-950 hover:bg-yellow-300 font-bold text-lg shadow-xl shadow-yellow-400/30 transition-all hover:scale-105 group">
                  Create your free store
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="mt-5 text-blue-400/50 text-sm">Free forever · No credit card · Cancel anytime</p>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-white py-16 px-5 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fillOpacity="0.9" />
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="font-bold text-xl">Blaqora</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                The e-commerce platform built for Nigerian sellers. Accept payments, manage orders, and grow your business.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-5 text-slate-300 uppercase tracking-wider">Product</h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "Integrations", "Changelog"].map((l) => (
                  <li key={l}><a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-5 text-slate-300 uppercase tracking-wider">Company</h4>
              <ul className="space-y-3">
                {["About us", "Blog", "Careers", "Contact"].map((l) => (
                  <li key={l}><a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-5 text-slate-300 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"].map((l) => (
                  <li key={l}><a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© 2026 Blaqora Technologies. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
