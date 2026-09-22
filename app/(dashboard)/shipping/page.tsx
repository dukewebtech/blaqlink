"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, Rocket, MapPinned, Plus, Pencil, Trash2, Upload, CheckCircle2, XCircle, Loader2, ShieldCheck, Info } from "lucide-react"
import { getStatesList, getCitiesByState, type NigerianState } from "@/lib/nigerian-locations"
import { useVendorUser } from "@/components/dashboard/vendor-user-context"

type ShippingMode = "manual" | "terminal_africa" | "shipbubble"

const API_KEY_HELP: Record<
  "terminal_africa" | "shipbubble",
  { title: string; steps: string[]; docsUrl: string; note?: string }
> = {
  terminal_africa: {
    title: "Where to find your Terminal Africa API key",
    steps: [
      "Log in to your Terminal Africa dashboard.",
      "Open Settings, then \"API keys\".",
      "Click \"Show\" to reveal your keys — each of Test and Live has a Public Key and a Secret Key.",
      "Copy the Secret Key (not the Public Key) — Test while you're trying this out, Live once you're ready for real orders.",
    ],
    docsUrl: "https://docs.terminal.africa/tship/authentication",
  },
  shipbubble: {
    title: "Where to find your Shipbubble API key",
    steps: [
      "Log in to your Shipbubble dashboard.",
      "Open Settings.",
      "Go to the \"API keys & Webhook\" tab.",
      "Generate a key if you don't have one — Test to try this out, Live for real orders.",
      "If Shipbubble shows separate Public and Secret keys, copy the Secret Key. Otherwise copy the one key it gives you.",
    ],
    docsUrl: "https://docs.shipbubble.com/get-started",
    note: "Shipbubble's own docs weren't fully clear on whether they split keys the way Terminal Africa does — check what your dashboard actually shows.",
  },
}

type VendorShippingProfile = {
  shipping_mode: ShippingMode
  pickup_street: string | null
  pickup_city: string | null
  pickup_state: string | null
  pickup_lga: string | null
  pickup_phone: string | null
  pickup_line2: string | null
  pickup_postal_code: string | null
  shipbubble_sender_address_code: string | null
  hasTerminalKey: boolean
  hasShipbubbleKey: boolean
  default_parcel_weight_kg: number | null
}

type DeliveryArea = {
  id: string
  name: string
  note: string | null
  fee: number
  state: string | null
  city: string | null
  sort_order: number
  is_active: boolean
}

type ParsedRow = {
  row: number
  name: string
  fee: string
  note: string
  state: string
  city: string
  errors: string[]
  isValid: boolean
}

type ImportResult = {
  success: boolean
  imported: number
  failed: number
  errors: { row: number; error: string }[]
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      values.push(current)
      current = ""
    } else {
      current += char
    }
  }
  values.push(current)
  return values
}

function parseCSV(content: string): ParsedRow[] {
  const lines = content.split("\n").filter((line) => line.trim())
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row")
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: ParsedRow = { row: i + 1, name: "", fee: "", note: "", state: "", city: "", errors: [], isValid: true }

    headers.forEach((header, index) => {
      const value = values[index]?.trim() || ""
      if (header === "name") row.name = value
      else if (header === "fee") row.fee = value
      else if (header === "note") row.note = value
      else if (header === "state") row.state = value
      else if (header === "city") row.city = value
    })

    if (!row.name) {
      row.errors.push("Name is required")
      row.isValid = false
    }
    if (!row.fee || Number.isNaN(Number.parseFloat(row.fee)) || Number.parseFloat(row.fee) < 0) {
      row.errors.push("Fee must be a valid, non-negative amount")
      row.isValid = false
    }
    if (!row.state) {
      row.errors.push("State is required")
      row.isValid = false
    } else if (!getStatesList().includes(row.state as NigerianState)) {
      row.errors.push(`"${row.state}" is not a recognised state`)
      row.isValid = false
    } else if (row.city && !getCitiesByState(row.state as NigerianState).includes(row.city)) {
      row.errors.push(`"${row.city}" is not a recognised city in ${row.state}`)
      row.isValid = false
    }

    rows.push(row)
  }

  return rows
}

export default function ShippingPage() {
  const { user: vendorUser, refetch: refetchVendorUser } = useVendorUser()
  const [areas, setAreas] = useState<DeliveryArea[]>([])
  const [loading, setLoading] = useState(true)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null)
  const [form, setForm] = useState({ name: "", fee: "", note: "", state: "", city: "" })
  const [saving, setSaving] = useState(false)

  const citiesForFormState = useMemo(
    () => (form.state ? getCitiesByState(form.state as NigerianState) : []),
    [form.state],
  )

  const [areaToDelete, setAreaToDelete] = useState<DeliveryArea | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const [profile, setProfile] = useState<VendorShippingProfile | null>(null)
  const [pickupForm, setPickupForm] = useState({ street: "", city: "", state: "", lga: "", phone: "", line2: "", postalCode: "" })
  const [savingMode, setSavingMode] = useState<ShippingMode | null>(null)
  const [savingPickup, setSavingPickup] = useState(false)
  const [validatingAddress, setValidatingAddress] = useState(false)
  const [pickupSaved, setPickupSaved] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [savingApiKey, setSavingApiKey] = useState(false)
  const [apiKeyHelpOpen, setApiKeyHelpOpen] = useState(false)
  const [defaultWeightInput, setDefaultWeightInput] = useState("")
  const [savingDefaultWeight, setSavingDefaultWeight] = useState(false)
  const [defaultWeightSaved, setDefaultWeightSaved] = useState(false)

  useEffect(() => {
    fetchAreas()
  }, [])

  // Re-derives local form/profile state whenever the shared vendor user
  // changes — on first load, and again after refetch() following a save
  // below (replaces this page's own fetch to /api/users/me).
  useEffect(() => {
    applyUserToProfile(vendorUser)
  }, [vendorUser])

  function applyUserToProfile(user: any) {
    try {
      if (user) {
        setProfile({
          shipping_mode: user.shipping_mode ?? "manual",
          pickup_street: user.pickup_street ?? null,
          pickup_city: user.pickup_city ?? null,
          pickup_state: user.pickup_state ?? null,
          pickup_lga: user.pickup_lga ?? null,
          pickup_phone: user.pickup_phone ?? null,
          pickup_line2: user.pickup_line2 ?? null,
          pickup_postal_code: user.pickup_postal_code ?? null,
          shipbubble_sender_address_code: user.shipbubble_sender_address_code ?? null,
          hasTerminalKey: !!user.terminal_africa_api_key,
          hasShipbubbleKey: !!user.shipbubble_api_key,
          default_parcel_weight_kg: user.default_parcel_weight_kg ?? null,
        })
        setApiKeyInput("")
        setPickupForm({
          street: user.pickup_street ?? "",
          city: user.pickup_city ?? "",
          state: user.pickup_state ?? "",
          lga: user.pickup_lga ?? "",
          phone: user.pickup_phone ?? "",
          line2: user.pickup_line2 ?? "",
          postalCode: user.pickup_postal_code ?? "",
        })
        setDefaultWeightInput(user.default_parcel_weight_kg != null ? String(user.default_parcel_weight_kg) : "")
      }
    } catch (error) {
      console.error("[v0] Failed to load shipping profile:", error)
    }
  }

  async function selectShippingMode(mode: ShippingMode) {
    if (!profile || profile.shipping_mode === mode) return
    setSavingMode(mode)
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping_mode: mode }),
      })
      if (res.ok) setProfile((p) => (p ? { ...p, shipping_mode: mode } : p))
    } catch (error) {
      console.error("[v0] Failed to switch shipping mode:", error)
    } finally {
      setSavingMode(null)
    }
  }

  async function saveApiKey(mode: "terminal_africa" | "shipbubble") {
    if (!apiKeyInput.trim()) return
    setSavingApiKey(true)
    try {
      const field = mode === "terminal_africa" ? "terminal_africa_api_key" : "shipbubble_api_key"
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: apiKeyInput.trim() }),
      })
      if (res.ok) {
        setApiKeyInput("")
        setProfile((p) =>
          p ? { ...p, hasTerminalKey: mode === "terminal_africa" ? true : p.hasTerminalKey, hasShipbubbleKey: mode === "shipbubble" ? true : p.hasShipbubbleKey } : p,
        )
      }
    } catch (error) {
      console.error("[v0] Failed to save API key:", error)
    } finally {
      setSavingApiKey(false)
    }
  }

  async function savePickupAddress() {
    setSavingPickup(true)
    setPickupSaved(false)
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_street: pickupForm.street.trim(),
          pickup_city: pickupForm.city.trim(),
          pickup_state: pickupForm.state.trim(),
          pickup_lga: pickupForm.lga.trim() || null,
          pickup_phone: pickupForm.phone.trim() || null,
          pickup_line2: pickupForm.line2.trim() || null,
          pickup_postal_code: pickupForm.postalCode.trim() || null,
        }),
      })
      if (res.ok) {
        setProfile((p) =>
          p
            ? {
                ...p,
                pickup_street: pickupForm.street.trim(),
                pickup_city: pickupForm.city.trim(),
                pickup_state: pickupForm.state.trim(),
                pickup_lga: pickupForm.lga.trim() || null,
                pickup_phone: pickupForm.phone.trim() || null,
                pickup_line2: pickupForm.line2.trim() || null,
                pickup_postal_code: pickupForm.postalCode.trim() || null,
              }
            : p,
        )
        setPickupSaved(true)
      }
    } catch (error) {
      console.error("[v0] Failed to save pickup address:", error)
    } finally {
      setSavingPickup(false)
    }
  }

  async function validatePickupWithShipbubble() {
    setValidatingAddress(true)
    try {
      const res = await fetch("/api/shipping/validate-pickup-address", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        await refetchVendorUser()
      } else {
        alert(data.error || "Could not validate this address")
      }
    } catch (error) {
      console.error("[v0] Failed to validate pickup address:", error)
    } finally {
      setValidatingAddress(false)
    }
  }

  async function saveDefaultWeight() {
    const weight = defaultWeightInput.trim() ? Number.parseFloat(defaultWeightInput) : null
    if (defaultWeightInput.trim() && (!Number.isFinite(weight) || (weight as number) <= 0)) return
    setSavingDefaultWeight(true)
    setDefaultWeightSaved(false)
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_parcel_weight_kg: weight }),
      })
      if (res.ok) {
        setProfile((p) => (p ? { ...p, default_parcel_weight_kg: weight } : p))
        setDefaultWeightSaved(true)
      }
    } catch (error) {
      console.error("[v0] Failed to save default parcel weight:", error)
    } finally {
      setSavingDefaultWeight(false)
    }
  }

  const pickupCitiesForState = useMemo(
    () => (pickupForm.state ? getCitiesByState(pickupForm.state as NigerianState) : []),
    [pickupForm.state],
  )

  async function fetchAreas() {
    try {
      setLoading(true)
      const res = await fetch("/api/delivery-areas")
      const data = await res.json()
      setAreas(data.areas ?? [])
    } catch (error) {
      console.error("[v0] Failed to load delivery areas:", error)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingArea(null)
    setForm({ name: "", fee: "", note: "", state: "", city: "" })
    setIsFormOpen(true)
  }

  function openEdit(area: DeliveryArea) {
    setEditingArea(area)
    setForm({ name: area.name, fee: String(area.fee), note: area.note ?? "", state: area.state ?? "", city: area.city ?? "" })
    setIsFormOpen(true)
  }

  async function handleSave() {
    const fee = Number.parseFloat(form.fee)
    if (!form.name.trim() || !Number.isFinite(fee) || fee < 0 || !form.state) return

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        fee,
        note: form.note.trim() || null,
        state: form.state,
        city: form.city || null,
      }
      const res = await fetch(editingArea ? `/api/delivery-areas/${editingArea.id}` : "/api/delivery-areas", {
        method: editingArea ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save delivery area")
      setIsFormOpen(false)
      fetchAreas()
    } catch (error) {
      console.error("[v0] Failed to save delivery area:", error)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(area: DeliveryArea) {
    setAreas((prev) => prev.map((a) => (a.id === area.id ? { ...a, is_active: !a.is_active } : a)))
    try {
      const res = await fetch(`/api/delivery-areas/${area.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !area.is_active }),
      })
      if (!res.ok) throw new Error("Failed to update")
    } catch (error) {
      console.error("[v0] Failed to toggle delivery area:", error)
      fetchAreas()
    }
  }

  async function handleDelete() {
    if (!areaToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/delivery-areas/${areaToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setAreaToDelete(null)
      fetchAreas()
    } catch (error) {
      console.error("[v0] Failed to delete delivery area:", error)
    } finally {
      setDeleting(false)
    }
  }

  function downloadTemplate() {
    const csv =
      "name,fee,note,state,city\n" +
      "Lagos mainland,3000,2 to 3 working days,Lagos,Ikeja\n" +
      "Lagos island,4000,1 to 2 working days,Lagos,Lagos Island\n" +
      "Abuja,6500,2 to 4 working days,FCT,\n"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "delivery-areas-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setImportResult(null)
    try {
      const content = await file.text()
      setParsedRows(parseCSV(content))
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Failed to parse CSV")
      setParsedRows([])
    } finally {
      e.target.value = ""
    }
  }

  async function handleImport() {
    const validRows = parsedRows.filter((r) => r.isValid)
    if (validRows.length === 0) {
      setParseError("No valid rows to import")
      return
    }
    setIsImporting(true)
    setImportResult(null)
    try {
      const res = await fetch("/api/delivery-areas/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areas: validRows.map((r) => ({
            name: r.name,
            fee: Number.parseFloat(r.fee),
            note: r.note || null,
            state: r.state,
            city: r.city || null,
          })),
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Import failed")
      setImportResult(result)
      setParsedRows([])
      fetchAreas()
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }

  const validCount = useMemo(() => parsedRows.filter((r) => r.isValid).length, [parsedRows])
  const invalidCount = parsedRows.length - validCount

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping</h1>
          <p className="text-muted-foreground mt-1">
            Set the delivery zones and fees shoppers choose from at checkout.
          </p>
        </div>

        {/* Mode selector */}
        <div className="grid md:grid-cols-3 gap-4">
          {(
            [
              { mode: "manual" as const, icon: MapPinned, title: "Manual zones", desc: "Set your own delivery areas and flat fees below, or import them from a CSV." },
              { mode: "terminal_africa" as const, icon: Truck, title: "Terminal Africa", desc: "Live courier rates calculated from your pickup address to the shopper's." },
              { mode: "shipbubble" as const, icon: Rocket, title: "Shipbubble", desc: "Live courier rates calculated from your pickup address to the shopper's." },
            ]
          ).map(({ mode, icon: Icon, title, desc }) => {
            const active = profile?.shipping_mode === mode
            return (
              <Card
                key={mode}
                className={`cursor-pointer transition ${active ? "ring-2 ring-primary" : "hover:border-primary/50"}`}
                onClick={() => selectShippingMode(mode)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className={`h-6 w-6 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    {savingMode === mode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : active ? (
                      <Badge className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">Switch</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2">{title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {/* API key — each vendor connects their own Terminal Africa / Shipbubble account, not a shared platform key */}
        {profile && profile.shipping_mode !== "manual" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>{profile.shipping_mode === "terminal_africa" ? "Terminal Africa" : "Shipbubble"} API key</CardTitle>
                <button
                  type="button"
                  onClick={() => setApiKeyHelpOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="How to get your API key"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              <CardDescription>
                Your own account's Secret Key — rates and bookings are billed to your account, not ours. Not the
                Public Key. Tap the info icon for exactly where to find it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(profile.shipping_mode === "terminal_africa" ? profile.hasTerminalKey : profile.hasShipbubbleKey) && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <ShieldCheck className="h-4 w-4" />
                  API key saved
                </div>
              )}
              <div className="flex items-center gap-3">
                <Input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    (profile.shipping_mode === "terminal_africa" ? profile.hasTerminalKey : profile.hasShipbubbleKey)
                      ? "Enter a new Secret Key to replace the saved one"
                      : "Paste your Secret Key"
                  }
                  className="max-w-sm"
                />
                <Button onClick={() => saveApiKey(profile.shipping_mode as "terminal_africa" | "shipbubble")} disabled={savingApiKey || !apiKeyInput.trim()}>
                  {savingApiKey ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save key
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Default parcel weight — fallback for products without their own weight set */}
        {profile && profile.shipping_mode !== "manual" && (
          <Card>
            <CardHeader>
              <CardTitle>Default parcel weight</CardTitle>
              <CardDescription>
                Used only when a product doesn't have its own shipping weight set — so checkout doesn't fail the
                moment one item is missing one. Setting a weight on the product itself always takes priority.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={defaultWeightInput}
                  onChange={(e) => setDefaultWeightInput(e.target.value)}
                  placeholder="0.5"
                  className="max-w-[160px]"
                />
                <span className="text-sm text-muted-foreground">kg</span>
                <Button onClick={saveDefaultWeight} disabled={savingDefaultWeight}>
                  {savingDefaultWeight ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save
                </Button>
                {defaultWeightSaved && <span className="text-sm text-muted-foreground">Saved</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pickup address — required once a live-rate mode is selected */}
        {profile && profile.shipping_mode !== "manual" && (
          <Card>
            <CardHeader>
              <CardTitle>Pickup address</CardTitle>
              <CardDescription>
                Where couriers collect parcels from. Used to calculate live rates for every order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Street address</Label>
                  <Input
                    value={pickupForm.street}
                    onChange={(e) => setPickupForm((f) => ({ ...f, street: e.target.value }))}
                    placeholder="12 Allen Avenue"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Address line 2{profile.shipping_mode === "terminal_africa" && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    value={pickupForm.line2}
                    onChange={(e) => setPickupForm((f) => ({ ...f, line2: e.target.value }))}
                    placeholder="Nearest bus stop, landmark, or suite/floor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={pickupForm.state}
                    onValueChange={(v) => setPickupForm((f) => ({ ...f, state: v, city: "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {getStatesList().map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select
                    value={pickupForm.city}
                    onValueChange={(v) => setPickupForm((f) => ({ ...f, city: v }))}
                    disabled={!pickupForm.state}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {pickupCitiesForState.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Contact phone{profile.shipping_mode === "terminal_africa" && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    type="tel"
                    value={pickupForm.phone}
                    onChange={(e) => setPickupForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="0803 000 0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Postal code{profile.shipping_mode === "terminal_africa" && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    value={pickupForm.postalCode}
                    onChange={(e) => setPickupForm((f) => ({ ...f, postalCode: e.target.value }))}
                    placeholder="100001"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={savePickupAddress}
                  disabled={
                    savingPickup ||
                    !pickupForm.street ||
                    !pickupForm.state ||
                    !pickupForm.city ||
                    (profile.shipping_mode === "terminal_africa" &&
                      (!pickupForm.line2.trim() || !pickupForm.phone.trim() || !pickupForm.postalCode.trim()))
                  }
                >
                  {savingPickup ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save pickup address
                </Button>
                {pickupSaved && <span className="text-sm text-muted-foreground">Saved</span>}
              </div>

              {profile.shipping_mode === "shipbubble" && (
                <div className="pt-4 border-t">
                  {profile.shipbubble_sender_address_code ? (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <ShieldCheck className="h-4 w-4" />
                      Pickup address validated with Shipbubble
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Shipbubble needs your pickup address validated once before it can quote rates.
                      </p>
                      <Button
                        variant="outline"
                        onClick={validatePickupWithShipbubble}
                        disabled={validatingAddress || !profile.pickup_street}
                      >
                        {validatingAddress ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Validate address with Shipbubble
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delivery zones table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Delivery zones</CardTitle>
              <CardDescription>Shoppers pick one of these at checkout for physical items.</CardDescription>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add zone
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>State / City</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading delivery zones...
                      </TableCell>
                    </TableRow>
                  ) : areas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No delivery zones yet. Add one, or import a CSV below.
                      </TableCell>
                    </TableRow>
                  ) : (
                    areas.map((area) => (
                      <TableRow key={area.id}>
                        <TableCell className="font-medium">{area.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {area.state ? (
                            <>
                              {area.state}
                              {area.city && <>, {area.city}</>}
                            </>
                          ) : (
                            <span className="text-xs italic">Not set — shopper picks manually</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{area.note || "—"}</TableCell>
                        <TableCell>₦{area.fee.toLocaleString("en-NG")}</TableCell>
                        <TableCell>
                          <Switch checked={area.is_active} onCheckedChange={() => handleToggleActive(area)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(area)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setAreaToDelete(area)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* CSV import */}
        <Card>
          <CardHeader>
            <CardTitle>Import from CSV</CardTitle>
            <CardDescription>
              Columns: name, fee, state, city, note. State is required; city and note are optional. Up to 100 rows
              per import.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2 bg-transparent" onClick={downloadTemplate}>
                Download template
              </Button>
              <label>
                <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                <Button asChild variant="outline" className="gap-2 bg-transparent">
                  <span>
                    <Upload className="h-4 w-4" />
                    Choose CSV file
                  </span>
                </Button>
              </label>
            </div>

            {parseError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            {importResult && importResult.success && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Import complete</AlertTitle>
                <AlertDescription>
                  Imported {importResult.imported} zone{importResult.imported === 1 ? "" : "s"}.
                  {importResult.failed > 0 && ` ${importResult.failed} row${importResult.failed === 1 ? "" : "s"} failed.`}
                </AlertDescription>
              </Alert>
            )}

            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    {validCount} valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                      {invalidCount} invalid
                    </Badge>
                  )}
                </div>
                <div className="border rounded-lg max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row) => (
                        <TableRow key={row.row} className={!row.isValid ? "bg-red-500/5" : undefined}>
                          <TableCell>{row.row}</TableCell>
                          <TableCell>{row.name || "—"}</TableCell>
                          <TableCell>{row.fee || "—"}</TableCell>
                          <TableCell>{row.state || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{row.city || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{row.note || "—"}</TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                Valid
                              </Badge>
                            ) : (
                              <span className="text-xs text-destructive">{row.errors.join(", ")}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={handleImport} disabled={isImporting || validCount === 0} className="gap-2">
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Import {validCount} zone{validCount === 1 ? "" : "s"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / edit dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArea ? "Edit delivery zone" : "Add delivery zone"}</DialogTitle>
            <DialogDescription>Shoppers see this name and fee at checkout.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="zone-name">Name</Label>
              <Input
                id="zone-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Lagos mainland"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-fee">Fee (₦)</Label>
              <Input
                id="zone-fee"
                type="number"
                min="0"
                value={form.fee}
                onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))}
                placeholder="3000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone-state">
                  State <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.state}
                  onValueChange={(value) => setForm((f) => ({ ...f, state: value, city: "" }))}
                >
                  <SelectTrigger id="zone-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {getStatesList().map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone-city">City (optional)</Label>
                <Select
                  value={form.city}
                  onValueChange={(value) => setForm((f) => ({ ...f, city: value }))}
                  disabled={!form.state}
                >
                  <SelectTrigger id="zone-city">
                    <SelectValue placeholder={form.state ? "Select city" : "Select a state first"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {citiesForFormState.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              When set, checkout auto-fills the shopper's state (and city, if given) from this zone instead of
              asking them to pick it separately.
            </p>
            <div className="space-y-2">
              <Label htmlFor="zone-note">Note (optional)</Label>
              <Textarea
                id="zone-note"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="2 to 3 working days"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.fee || !form.state}>
              {saving ? "Saving..." : editingArea ? "Save changes" : "Add zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!areaToDelete} onOpenChange={(open) => !open && setAreaToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete delivery zone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{areaToDelete?.name}&quot;? Shoppers will no longer be able to
              select it at checkout. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAreaToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* How to get your API key */}
      <Dialog open={apiKeyHelpOpen} onOpenChange={setApiKeyHelpOpen}>
        <DialogContent>
          {profile && profile.shipping_mode !== "manual" && (
            <>
              <DialogHeader>
                <DialogTitle>{API_KEY_HELP[profile.shipping_mode].title}</DialogTitle>
              </DialogHeader>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                {API_KEY_HELP[profile.shipping_mode].steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {API_KEY_HELP[profile.shipping_mode].note && (
                <p className="text-xs text-muted-foreground">{API_KEY_HELP[profile.shipping_mode].note}</p>
              )}
              <a
                href={API_KEY_HELP[profile.shipping_mode].docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline"
              >
                Read the full API docs
              </a>
              <DialogFooter>
                <Button onClick={() => setApiKeyHelpOpen(false)}>Got it</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
