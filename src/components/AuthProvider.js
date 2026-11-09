"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { api } from "@/libs/api"

const AuthContext = createContext({ me: null, loading: true, refresh: async () => null, logout: async () => {} })

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { user } = await api("/api/auth/me")
      setMe(user)
      return user
    } catch {
      setMe(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh().then((user) => {
      // Keeps the daily streak alive whenever the app is opened.
      if (user) api("/api/activity/ping", { method: "POST" }).catch(() => {})
    })
  }, [refresh])

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {})
    window.location.href = "/"
  }, [])

  return <AuthContext.Provider value={{ me, loading, refresh, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

// For pages that need a login: bounces to /login (and back again afterwards),
// which also covers an expired or stale session cookie.
export function useRequireAuth() {
  const auth = useAuth()
  const router = useRouter()
  const path = usePathname()
  useEffect(() => {
    if (!auth.loading && !auth.me) router.replace(`/login?next=${encodeURIComponent(path)}`)
  }, [auth.loading, auth.me, router, path])
  return auth
}

// For login / signup / reset: signed-in people go straight to the app.
export function useRedirectIfSignedIn() {
  const auth = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!auth.loading && auth.me) router.replace("/home")
  }, [auth.loading, auth.me, router])
  return auth
}
