"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, Lock, Key, CheckCircle2, Upload, Chrome, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  auth_id: string
  email: string
  full_name: string
  phone?: string
  location?: string
  business_name?: string
  profile_image?: string
  role: string
  created_at: string
  updated_at: string
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    business_name: "",
    profile_image: "",
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/users/me")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch user profile")
      }

      console.log("[v0] User profile loaded:", data.data.user)
      setFormData(data.data.user)
    } catch (err) {
      console.error("[v0] Error fetching user profile:", err)
      setError(err instanceof Error ? err.message : "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      setError("Image size must be less than 4MB")
      return
    }

    try {
      setIsUploadingImage(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image")
      }

      console.log("[v0] Profile image uploaded:", data.url)
      setFormData((prev) => ({ ...prev, profile_image: data.url }))
    } catch (err) {
      console.error("[v0] Error uploading image:", err)
      setError(err instanceof Error ? err.message : "Failed to upload image")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      console.log("[v0] Saving user profile:", formData)

      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile")
      }

      console.log("[v0] Profile saved successfully")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("[v0] Error saving profile:", err)
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account information and preferences</p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">{error}</div>
        )}

        {/* Profile Card */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your profile picture and business details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image & Business Name */}
            <div className="flex items-start gap-6 p-6 rounded-lg bg-muted/30 border border-border">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-4 ring-primary/10 transition-all duration-200 group-hover:ring-primary/30">
                  <AvatarImage src={formData.profile_image || "/placeholder.svg?height=96&width=96"} />
                  <AvatarFallback className="text-2xl">
                    {formData.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="profile-image-upload">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    asChild
                    disabled={isUploadingImage}
                  >
                    <span>
                      {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </span>
                  </Button>
                </label>
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-semibold">{formData.full_name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{formData.role || "Store Owner"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    Premium Account
                  </Badge>
                  <Badge variant="outline">Verified</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Business Name */}
            <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <Label htmlFor="businessName" className="text-sm font-medium">
                Business Name
              </Label>
              <Input
                id="businessName"
                placeholder="Your business name"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                value={formData.business_name || ""}
                onChange={(e) => handleInputChange("business_name", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300 delay-100">
                <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  value={formData.full_name || ""}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300 delay-150">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300 delay-200">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300 delay-250">
                <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="City, Country"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  value={formData.location || ""}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Current Password */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300 delay-100">
                <Label htmlFor="currentPassword" className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* New Password */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300 delay-150">
                <Label htmlFor="newPassword" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <Separator />

            {/* Password Requirements */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium mb-2">Password Requirements:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  At least 8 characters long
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  Contains uppercase and lowercase letters
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  Includes at least one number and special character
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Connected Accounts Card */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>Manage your third-party account connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Account */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors duration-200 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Chrome className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Google Account</p>
                  <p className="text-sm text-muted-foreground">guy.hawkins@gmail.com</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>

            {/* Add More Accounts */}
            <Button variant="outline" className="w-full transition-all duration-200 hover:bg-muted bg-transparent">
              Connect Another Account
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-3 pb-8">
          <Button
            size="lg"
            className="min-w-[200px] transition-all duration-200 hover:scale-105"
            onClick={handleSave}
            disabled={isSaving || saved}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Saved Successfully
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          {saved && (
            <p className="text-sm text-success animate-in fade-in slide-in-from-left-2 duration-300">
              Your account settings have been updated
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
