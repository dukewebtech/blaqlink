"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BUSINESS_CATEGORIES, MAX_CUSTOM_CATEGORY_LENGTH, OTHER_CATEGORY, isListedCategory } from "@/lib/business-categories"

/**
 * Pick a business type from the list, or choose "Other" and type it.
 * value is the stored text: a listed category or the vendor's own words.
 */
export function BusinessCategoryField({
  id = "businessCategory",
  value,
  onChange,
  required = false,
  error,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
}) {
  const [custom, setCustom] = useState(!!value && !isListedCategory(value))
  // A saved custom type that loads after first render (e.g. Store Settings).
  useEffect(() => {
    if (value && !isListedCategory(value)) setCustom(true)
  }, [value])

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        What do you sell? {required && <span className="text-destructive">*</span>}
      </Label>
      <Select
        value={custom ? OTHER_CATEGORY : value}
        onValueChange={(v) => {
          if (v === OTHER_CATEGORY) {
            setCustom(true)
            onChange("")
          } else {
            setCustom(false)
            onChange(v)
          }
        }}
      >
        <SelectTrigger id={id} className="h-11" aria-invalid={!!error && !custom}>
          <SelectValue placeholder="Choose your business type" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {BUSINESS_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
          <SelectItem value={OTHER_CATEGORY}>Something else…</SelectItem>
        </SelectContent>
      </Select>
      {custom && (
        <Input
          aria-label="Describe your business"
          placeholder="e.g. Solar installation"
          maxLength={MAX_CUSTOM_CATEGORY_LENGTH}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11"
          aria-invalid={!!error}
          autoFocus
        />
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
