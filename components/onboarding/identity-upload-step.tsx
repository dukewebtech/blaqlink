"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Upload, ArrowRight, Loader2, X, FileText, Camera } from "lucide-react"

interface Props {
  onNext: () => void
}

export function IdentityUploadStep({ onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)
  const [uploadingSelfie, setUploadingSelfie] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    bvn: "",
    governmentIdUrl: "",
    selfieUrl: "",
  })
  const [idFileName, setIdFileName] = useState("")
  const [selfieFileName, setSelfieFileName] = useState("")

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingId(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, governmentIdUrl: data.url }))
      setIdFileName(file.name)
      console.log("[v0] Government ID uploaded:", data.url)
    } catch (error) {
      console.error("[v0] ID upload error:", error)
      setError("Failed to upload ID. Please try again.")
    } finally {
      setUploadingId(false)
    }
  }

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingSelfie(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, selfieUrl: data.url }))
      setSelfieFileName(file.name)
      console.log("[v0] Selfie uploaded:", data.url)
    } catch (error) {
      console.error("[v0] Selfie upload error:", error)
      setError("Failed to upload selfie. Please try again.")
    } finally {
      setUploadingSelfie(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.governmentIdUrl) {
      setError("Please upload your government ID")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 3,
          data: formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save identity information")
      }

      onNext()
    } catch (error) {
      console.error("[v0] Error saving identity information:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Identity Verification</h2>
          <p className="text-sm text-muted-foreground">Help us verify your identity (KYC)</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 mb-6">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Your information is encrypted and stored securely. This helps us comply with regulations and protect your
          account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name (as on ID) *</Label>
          <Input
            id="fullName"
            placeholder="Enter your full legal name"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            required
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bvn">BVN (Bank Verification Number) *</Label>
          <Input
            id="bvn"
            placeholder="Enter your 11-digit BVN"
            required
            maxLength={11}
            value={formData.bvn}
            onChange={(e) => setFormData({ ...formData, bvn: e.target.value.replace(/\D/g, "") })}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">Used for identity verification only</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="governmentId">Government ID *</Label>
          <div className="relative">
            <input
              id="governmentId"
              type="file"
              accept="image/*,.pdf"
              onChange={handleIdUpload}
              className="hidden"
              disabled={uploadingId}
            />
            <label
              htmlFor="governmentId"
              className="flex items-center justify-center gap-2 h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
            >
              {formData.governmentIdUrl ? (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{idFileName}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.preventDefault()
                      setFormData({ ...formData, governmentIdUrl: "" })
                      setIdFileName("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : uploadingId ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Upload Government ID</p>
                  <p className="text-xs text-muted-foreground mt-1">National ID, Driver's License, or Passport</p>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="selfie">Selfie Photo (Optional)</Label>
          <div className="relative">
            <input
              id="selfie"
              type="file"
              accept="image/*"
              onChange={handleSelfieUpload}
              className="hidden"
              disabled={uploadingSelfie}
            />
            <label
              htmlFor="selfie"
              className="flex items-center justify-center gap-2 h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
            >
              {formData.selfieUrl ? (
                <div className="flex items-center gap-2 text-sm">
                  <Camera className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selfieFileName}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.preventDefault()
                      setFormData({ ...formData, selfieUrl: "" })
                      setSelfieFileName("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : uploadingSelfie ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Upload Selfie</p>
                  <p className="text-xs text-muted-foreground mt-1">Optional: Helps speed up verification</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting for Review...
            </>
          ) : (
            <>
              Submit for Verification
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
