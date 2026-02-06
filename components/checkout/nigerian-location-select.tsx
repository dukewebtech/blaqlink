"use client"

import { useState, useEffect } from "react"
import { getStatesList, getCitiesByState, type NigerianState } from "@/lib/nigerian-locations"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface NigerianLocationSelectProps {
  state: string
  city: string
  onStateChange: (state: string) => void
  onCityChange: (city: string) => void
  required?: boolean
}

export function NigerianLocationSelect({
  state,
  city,
  onStateChange,
  onCityChange,
  required = false,
}: NigerianLocationSelectProps) {
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    if (state) {
      const stateCities = getCitiesByState(state as NigerianState)
      setCities(stateCities)
      // Reset city when state changes
      if (!stateCities.includes(city)) {
        onCityChange("")
      }
    } else {
      setCities([])
      onCityChange("")
    }
  }, [state, city, onCityChange])

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="state">
          State {required && <span className="text-destructive">*</span>}
        </Label>
        <Select value={state} onValueChange={onStateChange}>
          <SelectTrigger id="state">
            <SelectValue placeholder="Select State" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {getStatesList().map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="city">
          City {required && <span className="text-destructive">*</span>}
        </Label>
        <Select value={city} onValueChange={onCityChange} disabled={!state}>
          <SelectTrigger id="city">
            <SelectValue placeholder={state ? "Select City" : "Select a state first"} />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
