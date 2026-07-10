"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"

export type Profile = {
  id: string
  display_name: string | null
  role: "admin" | "staff"
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      setUser(user)

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, role")
          .eq("id", user.id)
          .single()
        if (profileError) {
          console.error("[stock-book] profile fetch failed:", profileError.message)
        }
        if (!cancelled) setProfile((profileData as Profile) ?? null)
      }
      if (!cancelled) setLoading(false)
    }
    void load()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setProfile(null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return {
    user,
    profile,
    loading,
    isAdmin: profile?.role === "admin",
    displayName: profile?.display_name || user?.email || "",
    signOut,
  }
}
