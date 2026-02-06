"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, BarChart3, Users, TrendingUp, Lock, Smartphone, Globe } from "lucide-react"
import Image from "next/image"
import { SellerJourneyVideo } from "@/components/seller-journey-video"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-blue-600 text-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center font-bold text-blue-600">B</div>
            <span className="font-bold text-lg">Blaqora</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="#" className="hover:text-blue-100">Product</Link>
            <Link href="#" className="hover:text-blue-100">Pricing</Link>
            <Link href="#" className="hover:text-blue-100">Integration</Link>
            <Link href="#" className="hover:text-blue-100">Resources</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white hover:bg-blue-500">Sign up</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-full bg-yellow-300 text-blue-900 hover:bg-yellow-400 font-semibold">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-24 px-6 relative overflow-hidden">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-blue-100 mb-6">Trusted by 10K+ companies</p>
          <h1 className="md:text-6xl font-bold mb-6 leading-tight text-3xl">
            Sell services and products
            <br />
            with total control
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Complete e-commerce platform to manage your store, accept payments, track orders, and scale your business—all in one place.
          </p>
          <Link href="/signup">
            <Button className="rounded-full bg-yellow-300 text-blue-900 hover:bg-yellow-400 font-semibold px-8 py-6 text-lg">
              See How It Works
            </Button>
          </Link>
        </div>

        {/* Seller Journey Video Section */}
        <SellerJourneyVideo />

        {/* Dashboard Cards Mockup - Complex Grid Layout */}
        <div className="mx-auto max-w-7xl mt-20 relative px-4">
          {/* Mobile/Tablet Responsive Grid */}
          <div className="block lg:hidden space-y-4">
            {/* Store Overview */}
            <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg">Store Overview</h3>
                <span className="text-green-600 text-xs font-semibold bg-green-50 px-3 py-1 rounded-full">Active</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold">1,240</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Revenue</p>
                  <p className="text-2xl font-bold">₦2.4M</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Customers</p>
                  <p className="text-2xl font-bold">847</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Avg Order</p>
                  <p className="text-2xl font-bold">₦1,935</p>
                </div>
              </div>
            </div>

            {/* Sales Performance */}
            <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
              <h3 className="font-bold text-lg mb-4">Sales Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Products</span>
                    <span className="font-bold">₦1,680.00</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 w-3/4"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Services</span>
                    <span className="font-bold">₦720.00</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
              <h3 className="font-bold text-lg mb-4">Top Sellers</h3>
              <div className="space-y-3">
                {[
                  { name: 'Premium Web Design', sales: '₦45,000', icon: '🎨' },
                  { name: 'API Integration Service', sales: '₦32,500', icon: '⚙️' },
                  { name: 'Business Consulting', sales: '₦28,900', icon: '📊' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-600">{item.sales} this month</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg">Recent Orders</h3>
                <Link href="#" className="text-blue-600 text-sm font-semibold">View all</Link>
              </div>
              <div className="space-y-3">
                {[
                  { id: '#ORD-2847', customer: 'Chioma Obi', amount: '₦15,800', status: 'Delivered' },
                  { id: '#ORD-2846', customer: 'Tunde Ahmed', amount: '₦8,500', status: 'Processing' }
                ].map((order, i) => (
                  <div key={i} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold">{order.id}</p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{order.customer}</p>
                    <p className="text-sm font-bold text-blue-600">{order.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block relative h-[600px] perspective">
            {/* Top Left - Store Overview Card */}
            <div className="absolute left-12 top-0 bg-white text-slate-900 rounded-2xl p-6 shadow-2xl w-72 z-30">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-lg">Store Overview</h3>
                <span className="text-green-600 text-xs font-semibold bg-green-50 px-3 py-1 rounded-full">Active</span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold mt-1">1,240</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">₦2.4M</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold mt-1">847</p>
                </div>
              </div>
            </div>

            {/* Top Right - Sales Status Card */}
            <div className="absolute right-12 top-0 bg-white text-slate-900 rounded-2xl p-6 shadow-2xl w-80 z-30">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-lg">Sales Performance</h3>
                <span className="text-blue-600 text-xs font-semibold bg-blue-50 px-3 py-1 rounded-full">Live</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Products Sold</span>
                    <span className="font-bold">₦1,680</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 w-3/4"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Services Rendered</span>
                    <span className="font-bold">₦720</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 w-1/2"></div>
                  </div>
                </div>
                <div className="border-t pt-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Available Balance</p>
                    <p className="font-bold text-lg">₦2,400.00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Left - Top Seller Card */}
            <div className="absolute left-0 top-32 bg-white text-slate-900 rounded-2xl p-6 shadow-2xl w-72 z-20">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-white text-xl">🎨</div>
                <div className="flex-1">
                  <h3 className="font-bold">Premium Web Design</h3>
                  <p className="text-xs text-gray-600">Top Product This Month</p>
                  <Link href="#" className="text-blue-600 text-xs font-semibold mt-1">See details</Link>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Units Sold</span>
                  <span className="font-bold">245</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-bold">₦45,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating</span>
                  <span className="font-bold">4.9 ⭐</span>
                </div>
                <div className="pt-2 flex gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={`h-2 rounded-full flex-1 ${i >= 2 ? 'bg-green-500' : 'bg-green-100'}`}></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Center - Service Cards */}
            <div className="absolute left-1/2 top-32 -translate-x-1/2 space-y-4 w-72 z-10">
              <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    ⚙️
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">API Integration</p>
                    <p className="text-xs text-gray-600">Technical Services</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs font-bold text-gray-600">₦32,500</span>
                  <span className="text-xs font-bold">142 sales</span>
                </div>
              </div>
              <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    📊
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Business Consulting</p>
                    <p className="text-xs text-gray-600">Professional Services</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs font-bold text-gray-600">₦28,900</span>
                  <span className="text-xs font-bold">98 sales</span>
                </div>
              </div>
            </div>

            {/* Middle Right - Store Stats */}
            <div className="absolute right-0 top-32 bg-white text-slate-900 rounded-2xl p-6 shadow-2xl w-72 z-20">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-4xl font-bold">847</p>
                  <p className="text-sm text-gray-600">Total Customers</p>
                </div>
                <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">+12% mo</span>
              </div>
              <div className="h-32 flex items-end gap-1">
                {[40, 35, 50, 45, 42, 48, 70].map((height, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${
                      i === 6 ? 'bg-blue-600' : 'bg-blue-100'
                    }`}
                    style={{ height: `${(height / 70) * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Bottom Left - Inventory Status */}
            <div className="absolute left-0 bottom-0 bg-white text-slate-900 rounded-2xl p-6 shadow-2xl w-72 z-10">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold">Inventory Status</h3>
                <Link href="#" className="text-blue-600 text-sm font-semibold">Manage</Link>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">In Stock</p>
                  <p className="text-xs text-gray-600 mb-2">425 items</p>
                  <div className="flex gap-1">
                    {[...Array(11)].map((_, i) => (
                      <div key={i} className={`h-2 w-3 rounded-sm ${i < 9 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Low Stock</p>
                  <p className="text-xs text-gray-600 mb-2">24 items</p>
                  <div className="flex gap-1">
                    {[...Array(11)].map((_, i) => (
                      <div key={i} className={`h-2 w-3 rounded-sm ${i < 3 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Out of Stock</p>
                  <p className="text-xs text-gray-600 mb-2">8 items</p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-2 w-3 rounded-sm ${i < 2 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Center - Recent Orders */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 space-y-4 w-80 z-10">
              <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
                <p className="text-center text-gray-600 text-sm mb-2">Latest Order</p>
                <p className="text-center text-3xl font-bold font-mono mb-4">#ORD-2847</p>
                <div className="space-y-3 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer</span>
                    <span className="font-semibold">Chioma Obi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-bold text-blue-600">₦15,800</span>
                  </div>
                </div>
                <Button className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm">
                  View Order Details
                </Button>
              </div>
              <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-bold">Tunde Ahmed</h3>
                    <p className="text-xs text-gray-600">Best Customer</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Purchases</span>
                    <span className="font-bold">₦145,600</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">VIP Member</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Right - Performance Analytics */}
            <div className="absolute right-0 bottom-0 bg-white text-slate-900 rounded-2xl p-6 shadow-2xl w-72 z-10">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold">Performance</h3>
                <Link href="#" className="text-blue-600 text-sm font-semibold">Analytics</Link>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-3">Conversion Rate</p>
                  <p className="text-xs text-gray-600 mb-2">3.8% this month</p>
                  <div className="flex items-end justify-between">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 text-green-600 font-bold">
                      ↑
                    </div>
                    <span className="font-bold text-lg text-green-600">+0.5%</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-600 mb-4">Monthly Revenue Trend</p>
                  <div className="h-24 flex items-end gap-1">
                    {[30, 25, 40, 35, 32, 45, 70].map((height, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-sm ${
                          i === 6 ? 'bg-blue-600' : 'bg-blue-100'
                        }`}
                        style={{ height: `${(height / 70) * 100}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-blue-600 text-sm font-semibold mb-2">TRANSFORM YOUR SELLING</p>
            <h2 className="text-4xl font-bold mb-4">Everything you need to sell</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whether selling products, services, or digital goods, Blaqora gives you the tools to manage it all from one powerful dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Store Solution</h3>
              <p className="text-gray-600 text-sm">
                Create a beautiful online store in minutes. Sell physical products, services, or digital goods without any technical setup.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Customer Management</h3>
              <p className="text-gray-600 text-sm">
                Track all customer interactions, manage payments, and build lasting relationships with automated follow-ups and analytics.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Team Coordination</h3>
              <p className="text-gray-600 text-sm">
                Collaborate with your team, assign tasks, track orders, and manage inventory—all from a unified dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-blue-600 text-sm font-semibold mb-4">SOLUTIONS</p>
              <h2 className="font-bold mb-6 text-2xl">Seamless solutions for every corner of your business</h2>
              <p className="text-gray-600 mb-8">
                From individual freelancers to enterprise teams, Blaqora scales with your business. Manage products, services, payments, and customers all in one intuitive platform. Automated workflows save time and reduce errors.
              </p>
              <Link href="/signup">
                <Button className="rounded-full bg-yellow-300 text-blue-900 hover:bg-yellow-400 font-semibold px-8">
                  Start Your Store Now
                </Button>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-white opacity-10 rounded-full"></div>
              <Image
                src="/dashboard-preview.jpg"
                alt="Dashboard"
                width={400}
                height={400}
                className="relative z-10 rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="bg-blue-600 text-white py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="bg-white bg-opacity-10 rounded-3xl p-8 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold mb-2 text-primary">15K+</div>
                  <p className="text-sm text-primary">Active Sellers</p>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2 text-primary">$45M+</div>
                  <p className="text-sm text-primary">Annual Volume</p>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2 text-primary">24/7</div>
                  <p className="text-sm text-primary">Support</p>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2 text-primary">150+</div>
                  <p className="text-sm text-primary">Countries</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-bold mb-6 text-3xl">Built-in tools for your success</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-yellow-300 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-900 font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Performance Tracker</h3>
                    <p className="text-blue-100 text-sm">Real-time analytics and insights into your sales performance</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-yellow-300 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-900 font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Time and Inventory</h3>
                    <p className="text-blue-100 text-sm">Automated inventory tracking and stock management</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-yellow-300 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-900 font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Global Payments</h3>
                    <p className="text-blue-100 text-sm">Accept payments from anywhere, settle globally</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      

      {/* Testimonials */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-bold mb-4 text-3xl">Users love us</h2>
            <p className="text-gray-600">See what our sellers are saying about their success with Blaqora</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Ahmed', role: 'Shop Owner', text: 'Blaqora made it easy to launch my online store. I went from zero to profitable in just 2 weeks!' },
              { name: 'Marcus Johnson', role: 'Services Provider', text: 'The payment system is seamless and I love the analytics. My revenue has grown 3x since switching to Blaqora.' },
              { name: 'Elena Martinez', role: 'E-commerce Manager', text: 'Managing multiple product catalogs and payments is now simple. This platform saved us hours every week.' },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg">
                <p className="text-gray-600 mb-6">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-blue-600 text-white py-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="bg-yellow-300 text-blue-900 rounded-3xl p-12">
            <h2 className="font-bold text-2xl mb-2.5">Start selling with Blaqora today</h2>
            <p className="mb-8 text-blue-800">Join thousands of sellers earning on the platform. Free to get started.</p>
            <Link href="/signup">
              <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700 font-semibold px-8">
                Create Your Store
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-600 text-white py-12 px-6">
        <div className="mx-auto max-w-6xl grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center font-bold text-blue-600 text-xs">B</div>
              <span className="font-bold">Blaqora</span>
            </div>
            <p className="text-blue-100 text-sm">E-commerce platform for selling products and services globally.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link href="#" className="hover:text-white">Features</Link></li>
              <li><Link href="#" className="hover:text-white">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white">API</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link href="#" className="hover:text-white">About</Link></li>
              <li><Link href="#" className="hover:text-white">Blog</Link></li>
              <li><Link href="#" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link href="#" className="hover:text-white">Privacy</Link></li>
              <li><Link href="#" className="hover:text-white">Terms</Link></li>
              <li><Link href="#" className="hover:text-white">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-blue-500 pt-8 text-center text-sm text-blue-100">
          <p>© 2026 Blaqora. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
