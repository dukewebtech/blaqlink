"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const MIN_PASSWORD_LENGTH = 8

/** Password input with show/hide and an optional length hint. */
export function PasswordField({
  id = "password",
  label = "Password",
  value,
  onChange,
  autoComplete,
  error,
  showHint = false,
}: {
  id?: string
  label?: string
  value: string
  onChange: (v: string) => void
  autoComplete: "new-password" | "current-password"
  error?: string
  showHint?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const short = value.length > 0 && value.length < MIN_PASSWORD_LENGTH
  const describedBy = [error && `${id}-error`, showHint && `${id}-hint`].filter(Boolean).join(" ") || undefined
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="h-12 pr-12"
          aria-invalid={!!error}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2.5 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {showHint && !error && (
        <p id={`${id}-hint`} className={`text-xs ${short ? "text-amber-700" : "text-muted-foreground"}`}>
          {short ? `${MIN_PASSWORD_LENGTH - value.length} more character${MIN_PASSWORD_LENGTH - value.length === 1 ? "" : "s"} to go` : `At least ${MIN_PASSWORD_LENGTH} characters`}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
