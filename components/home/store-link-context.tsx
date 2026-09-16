"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

function toSlug(raw: string) {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 30)
}

interface StoreLinkContextValue {
  slug: string
  displayName: string
  initial: string
  setRaw: (raw: string) => void
  signupHref: (base?: string) => string
}

const StoreLinkContext = createContext<StoreLinkContextValue | null>(null)

export function StoreLinkProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState("")

  const value = useMemo<StoreLinkContextValue>(() => {
    const displayName = slug || "yourbrand"
    return {
      slug,
      displayName,
      initial: displayName.charAt(0).toUpperCase(),
      setRaw: (raw: string) => setSlug(toSlug(raw)),
      signupHref: (base = "/signup") => (slug ? `${base}?store=${encodeURIComponent(slug)}` : base),
    }
  }, [slug])

  return <StoreLinkContext.Provider value={value}>{children}</StoreLinkContext.Provider>
}

export function useStoreLink() {
  const ctx = useContext(StoreLinkContext)
  if (!ctx) throw new Error("useStoreLink must be used within a StoreLinkProvider")
  return ctx
}
