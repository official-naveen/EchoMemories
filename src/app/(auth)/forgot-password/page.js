"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/libs/api"
import { useRedirectIfSignedIn } from "@/components/AuthProvider"
import Ghost from "@/components/Ghost"
import Mascot from "@/components/Mascot"
import { Field, PasswordField, OtpInput, FormError, Spinner } from "@/components/forms"
import usePageTitle from "@/hooks/usePageTitle"

const RESEND_SECONDS = 30

export default function ForgotPassword() {
  usePageTitle("Reset password")
  useRedirectIfSignedIn()
  const router = useRouter()
  const [step, setStep] = useState("email") // email -> code
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function requestCode(e) {
    e?.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api("/api/auth/forgot-password", { method: "POST", body: { email } })
      setStep("code")
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function reset(e) {
    e.preventDefault()
    setError("")
    if (otp.length !== 6) return setError("Enter the 6-digit code from your email")
    if (password.length < 8) return setError("Password must be at least 8 characters")
    setLoading(true)
    try {
      await api("/api/auth/reset-password", { method: "POST", body: { otp, password } })
      router.replace("/login?reset=1")
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-head">
        {step === "email" ? <Mascot name="thinking" size={96} /> : <Ghost size={64} float />}
        <h1>{step === "email" ? "Forgot your password?" : "Check your email"}</h1>
        <p>
          {step === "email"
            ? "Enter your email and we’ll send you a code to reset it."
            : <>If an account exists for <strong>{email}</strong>, a 6-digit code is on its way. It expires in 15 minutes.</>}
        </p>
      </div>

      {step === "email" ? (
        <form className="auth-form" onSubmit={requestCode}>
          <FormError>{error}</FormError>
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn primary big block" disabled={loading || !email.trim()}>
            {loading ? <Spinner /> : "Send code"}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={reset}>
          <FormError>{error}</FormError>
          <OtpInput value={otp} onChange={setOtp} autoFocus />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            hint="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn primary big block" disabled={loading}>
            {loading ? <Spinner /> : "Reset password"}
          </button>
          <div className="form-opts">
            <button type="button" className="link-btn" onClick={() => { setStep("email"); setError(""); setOtp("") }}>
              Use a different email
            </button>
            <button type="button" className="link-btn" disabled={cooldown > 0 || loading} onClick={requestCode}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}

      <p className="auth-foot">
        Remembered it? <Link href="/login">Back to log in</Link>
      </p>
    </div>
  )
}
