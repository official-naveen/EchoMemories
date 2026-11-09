"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/libs/api"
import { useAuth, useRedirectIfSignedIn } from "@/components/AuthProvider"
import Ghost from "@/components/Ghost"
import { Field, PasswordField, FormError, Spinner } from "@/components/forms"
import usePageTitle from "@/hooks/usePageTitle"

// Only ever return to a page on this site.
function safeNext(raw) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/home"
}

export default function Login() {
  usePageTitle("Log in")
  useRedirectIfSignedIn()
  const router = useRouter()
  const { refresh } = useAuth()
  const [form, setForm] = useState({ identifier: "", password: "", remember: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [justReset, setJustReset] = useState(false)

  useEffect(() => {
    setJustReset(new URLSearchParams(window.location.search).get("reset") === "1")
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api("/api/auth/login", { method: "POST", body: form })
      await refresh()
      router.replace(safeNext(new URLSearchParams(window.location.search).get("next")))
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-head">
        <Ghost size={64} float priority />
        <h1>Welcome back</h1>
        <p>Continue where your memories left off.</p>
      </div>

      <form className="auth-form" onSubmit={submit} noValidate={false}>
        {justReset && <div className="alert ok" role="status">Password updated. Log in with your new password.</div>}
        <FormError>{error}</FormError>

        <Field
          label="Email or username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          value={form.identifier}
          onChange={(e) => setForm({ ...form, identifier: e.target.value })}
        />
        <PasswordField
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          right={<Link href="/forgot-password">Forgot password?</Link>}
        />

        <div className="form-opts">
          <label className="check">
            <input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} />
            Keep me logged in
          </label>
        </div>

        <button className="btn primary big block" disabled={loading}>
          {loading ? <Spinner /> : "Log in"}
        </button>
      </form>

      <p className="auth-foot">
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  )
}
