"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import jsQR from "jsqr"
import { Camera, CameraOff, CheckCircle2, Loader2, Ticket, XCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EventProduct {
  id: string
  title: string
}

type Result =
  | { kind: "checked_in"; holder: string | null; tier: string | null }
  | { kind: "already_used"; holder: string | null; checkedInAt: string | null }
  | { kind: "error"; title: string; detail: string }

const timeFormat = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit" })
const SAME_CODE_COOLDOWN_MS = 4000

export default function CheckInPage() {
  const [events, setEvents] = useState<EventProduct[] | null>(null)
  const [eventId, setEventId] = useState("")
  const [counts, setCounts] = useState<{ total: number; checkedIn: number } | null>(null)
  const [camera, setCamera] = useState<"off" | "starting" | "on" | "denied" | "unsupported">("off")
  const [manual, setManual] = useState("")
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const frame = useRef<number | undefined>(undefined)
  const lastScan = useRef<{ code: string; at: number } | null>(null)
  const busy = useRef(false)

  useEffect(() => {
    fetch("/api/products?type=event&status=published&limit=200")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const list: EventProduct[] = (d.products ?? []).map((p: EventProduct) => ({ id: p.id, title: p.title }))
        setEvents(list)
        if (list.length === 1) setEventId(list[0].id)
      })
      .catch(() => setEvents([]))
  }, [])

  const refreshCounts = useCallback(() => {
    if (!eventId) return
    fetch(`/api/tickets/check-in?productId=${eventId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCounts({ total: d.total, checkedIn: d.checkedIn }))
      .catch(() => {})
  }, [eventId])

  useEffect(() => {
    setCounts(null)
    refreshCounts()
  }, [refreshCounts])

  const submit = useCallback(
    async (code: string) => {
      if (!eventId || busy.current) return
      busy.current = true
      setChecking(true)
      try {
        const res = await fetch("/api/tickets/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, productId: eventId }),
        })
        const d = await res.json()
        if (!res.ok) setResult({ kind: "error", title: "Check-in failed", detail: d.error ?? "Try again." })
        else if (d.result === "checked_in") setResult({ kind: "checked_in", holder: d.holder, tier: d.tier })
        else if (d.result === "already_used") setResult({ kind: "already_used", holder: d.holder, checkedInAt: d.checkedInAt })
        else if (d.result === "wrong_event") setResult({ kind: "error", title: "Wrong event", detail: "This ticket is for a different event." })
        else if (d.result === "cancelled") setResult({ kind: "error", title: "Ticket cancelled", detail: "This ticket was refunded. Don't admit." })
        else setResult({ kind: "error", title: "Not a valid ticket", detail: d.message ?? "No ticket with that code for your events." })
        if ("vibrate" in navigator) navigator.vibrate(d.result === "checked_in" ? 80 : [60, 60, 60])
        refreshCounts()
      } catch {
        setResult({ kind: "error", title: "No connection", detail: "Check your internet and scan again." })
      } finally {
        busy.current = false
        setChecking(false)
      }
    },
    [eventId, refreshCounts],
  )

  const stopCamera = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    setCamera((c) => (c === "on" || c === "starting" ? "off" : c))
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("unsupported")
      return
    }
    setCamera("starting")
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      const v = video.current!
      v.srcObject = stream.current
      await v.play()
      setCamera("on")
      const tick = () => {
        const c = canvas.current
        if (c && v.readyState === v.HAVE_ENOUGH_DATA) {
          c.width = v.videoWidth
          c.height = v.videoHeight
          const ctx = c.getContext("2d", { willReadFrequently: true })!
          ctx.drawImage(v, 0, 0, c.width, c.height)
          const found = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height, { inversionAttempts: "dontInvert" })
          if (found?.data) {
            const now = Date.now()
            const same = lastScan.current && lastScan.current.code === found.data && now - lastScan.current.at < SAME_CODE_COOLDOWN_MS
            if (!same) {
              lastScan.current = { code: found.data, at: now }
              submit(found.data)
            }
          }
        }
        frame.current = requestAnimationFrame(tick)
      }
      frame.current = requestAnimationFrame(tick)
    } catch {
      stream.current?.getTracks().forEach((t) => t.stop())
      setCamera("denied")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Check-in</h1>
        <p className="text-sm text-muted-foreground">Scan tickets at the entrance. Each ticket is admitted once.</p>
      </div>

      {events === null && <div className="h-24 animate-pulse rounded-lg bg-muted" aria-busy="true" aria-label="Loading events" />}

      {events?.length === 0 && (
        <Card className="p-8 text-center space-y-3">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold">No published events</p>
          <p className="text-sm text-muted-foreground">Publish an event to sell tickets, then check guests in here.</p>
          <Button asChild>
            <Link href="/products/create?type=event">Create an event</Link>
          </Button>
        </Card>
      )}

      {events && events.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event">Event</Label>
              <Select value={eventId} onValueChange={(v) => { setEventId(v); setResult(null) }}>
                <SelectTrigger id="event">
                  <SelectValue placeholder="Choose the event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {counts && (
              <p className="text-sm" aria-live="polite">
                <span className="text-2xl font-bold tabular-nums">{counts.checkedIn}</span>
                <span className="text-muted-foreground"> of {counts.total} checked in</span>
              </p>
            )}

            <div className="relative aspect-square overflow-hidden rounded-lg bg-black/90">
              <video ref={video} className={camera === "on" ? "h-full w-full object-cover" : "hidden"} playsInline muted />
              <canvas ref={canvas} className="hidden" />
              {camera !== "on" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
                  {camera === "denied" || camera === "unsupported" ? (
                    <>
                      <CameraOff className="h-8 w-8" aria-hidden="true" />
                      <p className="text-sm">
                        {camera === "denied" ? "Camera access was blocked. Allow it in your browser settings, or type the code below." : "This browser can't use the camera. Type the code below."}
                      </p>
                    </>
                  ) : (
                    <Button onClick={startCamera} disabled={!eventId || camera === "starting"} variant="secondary">
                      {camera === "starting" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
                      {eventId ? "Start scanning" : "Choose the event first"}
                    </Button>
                  )}
                </div>
              )}
            </div>
            {camera === "on" && (
              <Button variant="outline" className="w-full" onClick={stopCamera}>
                Stop camera
              </Button>
            )}

            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (manual.trim()) submit(manual)
              }}
            >
              <Label htmlFor="manual-code">Or type the code under the QR</Label>
              <div className="flex gap-2">
                <Input id="manual-code" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. 3F9A21C4" autoCapitalize="characters" className="font-mono" disabled={!eventId} />
                <Button type="submit" disabled={!eventId || !manual.trim() || checking}>
                  Check in
                </Button>
              </div>
            </form>
          </Card>

          <Card
            className={
              "flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center " +
              (result?.kind === "checked_in" ? "bg-green-600 text-white" : result ? "bg-red-600 text-white" : "")
            }
            role="status"
            aria-live="assertive"
          >
            {checking && <Loader2 className="h-10 w-10 animate-spin" aria-label="Checking ticket" />}
            {!checking && !result && <p className="text-muted-foreground">Scan a ticket to see the result here.</p>}
            {!checking && result?.kind === "checked_in" && (
              <>
                <CheckCircle2 className="h-16 w-16" aria-hidden="true" />
                <p className="text-3xl font-bold">Admit</p>
                <p className="text-lg">{[result.holder, result.tier].filter(Boolean).join(" · ")}</p>
              </>
            )}
            {!checking && result?.kind === "already_used" && (
              <>
                <XCircle className="h-16 w-16" aria-hidden="true" />
                <p className="text-3xl font-bold">Already used</p>
                <p className="text-lg">
                  {result.holder}
                  {result.checkedInAt ? ` · checked in at ${timeFormat.format(new Date(result.checkedInAt))}` : ""}
                </p>
              </>
            )}
            {!checking && result?.kind === "error" && (
              <>
                <XCircle className="h-16 w-16" aria-hidden="true" />
                <p className="text-3xl font-bold">{result.title}</p>
                <p className="text-lg">{result.detail}</p>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
