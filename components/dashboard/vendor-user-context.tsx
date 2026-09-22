"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

// The full `users` row, as returned by GET /api/users/me. Kept loose (not a
// closed interface) since consumers each read different subsets of a wide,
// evolving table — same looseness the individual pages already had before
// this was centralized.
export type VendorUser = Record<string, any>

interface VendorUserContextValue {
  user: VendorUser | null
  loading: boolean
  /** Re-fetches /api/users/me and updates every consumer. Call this after a
   *  save that changes a field the sidebar shows (name, business name, avatar)
   *  — the layout no longer remounts per navigation, so nothing else will. */
  refetch: () => Promise<void>
}

const VendorUserContext = createContext<VendorUserContextValue | null>(null)

// Fetches the vendor's profile exactly once per dashboard session (not once
// per page navigation) and shares it with every page underneath — this is
// what the 9+ pages that used to each call /api/users/me on their own mount
// now read from instead.
export function VendorUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<VendorUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/users/me")
      const result = await response.json()
      if (result.ok && result.data?.user) {
        setUser(result.data.user)
      }
    } catch (error) {
      console.error("[v0] Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return <VendorUserContext.Provider value={{ user, loading, refetch: fetchUser }}>{children}</VendorUserContext.Provider>
}

export function useVendorUser(): VendorUserContextValue {
  const ctx = useContext(VendorUserContext)
  if (!ctx) {
    throw new Error("useVendorUser must be used within VendorUserProvider (app/(dashboard)/layout.tsx)")
  }
  return ctx
}
