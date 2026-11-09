"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/libs/api"
import { useAuth, useRedirectIfSignedIn } from "@/components/AuthProvider"
import Ghost from "@/components/Ghost"
import Icon from "@/components/Icon"
import { roomColor } from "@/components/Avatar"
import { Field, PasswordField, OtpInput, FormError, Spinner } from "@/components/forms"
import usePageTitle from "@/hooks/usePageTitle"

const STEPS = ["Details", "Verify", "Account", "About you", "Rooms"]
const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_SECONDS = 30
const WANT_ROOMS = 5

export default function Signup() {
  usePageTitle("Sign up")
  useRedirectIfSignedIn()
  const router = useRouter()
  const { refresh } = useAuth()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)

  const [form, setForm] = useState({
    fullName: "", email: "", otp: "",
    username: "", nickname: "", password: "",
    bio: "", country: "", dateOfBirth: "",
    rooms: [],
  })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  /* ---------- resend cooldown ---------- */
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  /* ---------- live username check ---------- */
  const [uname, setUname] = useState({ state: "idle", message: "", suggestions: [] })
  useEffect(() => {
    if (step !== 2) return
    const name = form.username.trim().toLowerCase()
    if (!name) return setUname({ state: "idle", message: "", suggestions: [] })
    if (!USERNAME_RE.test(name)) {
      return setUname({ state: "invalid", message: "3-20 letters, numbers or underscores, starting with a letter", suggestions: [] })
    }
    setUname({ state: "checking", message: "Checking…", suggestions: [] })
    const t = setTimeout(async () => {
      try {
        const d = await api("/api/auth/check-username", { method: "POST", body: { username: name } })
        setUname(d.available
          ? { state: "ok", message: "Available", suggestions: [] }
          : { state: "taken", message: "That username is taken", suggestions: d.suggestions || [] })
      } catch {
        setUname({ state: "idle", message: "", suggestions: [] }) // the server re-checks on submit anyway
      }
    }, 400)
    return () => clearTimeout(t)
  }, [form.username, step])

  /* ---------- rooms ---------- */
  const [rooms, setRooms] = useState([])
  const [roomQuery, setRoomQuery] = useState("")
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [minRooms, setMinRooms] = useState(WANT_ROOMS)
  const gotInitial = useRef(false)

  useEffect(() => {
    if (step !== 4) return
    const q = roomQuery.trim()
    const t = setTimeout(async () => {
      setRoomsLoading(true)
      try {
        const url = q ? `/api/rooms?search=${encodeURIComponent(q)}&limit=24` : "/api/rooms?random=1&limit=12"
        const d = await api(url)
        setRooms(d.rooms || [])
        if (!q && !gotInitial.current) {
          gotInitial.current = true
          setMinRooms(Math.min(WANT_ROOMS, (d.rooms || []).length)) // tiny communities can still finish signup
        }
      } catch {
        setRooms([])
      } finally {
        setRoomsLoading(false)
      }
    }, q ? 250 : 0)
    return () => clearTimeout(t)
  }, [step, roomQuery])

  const toggleRoom = (id) => {
    setError("")
    setForm((f) => ({ ...f, rooms: f.rooms.includes(id) ? f.rooms.filter((r) => r !== id) : [...f.rooms, id] }))
  }

  /* ---------- actions ---------- */
  const sendOtp = () => api("/api/auth/send-otp", { method: "POST", body: { email: form.email.trim() } })

  async function resend() {
    setError("")
    try {
      await sendOtp()
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      setError(err.message)
    }
  }

  async function next(e) {
    e.preventDefault()
    setError("")
    try {
      setLoading(true)

      if (step === 0) {
        if (form.fullName.trim().length < 2) throw new Error("Please enter your name")
        if (!EMAIL_RE.test(form.email.trim())) throw new Error("Enter a valid email address")
        await sendOtp()
        setCooldown(RESEND_SECONDS)
      }

      if (step === 1) {
        if (form.otp.length !== 6) throw new Error("Enter the 6-digit code from your email")
        await api("/api/auth/verify-otp", { method: "POST", body: { otp: form.otp } })
      }

      if (step === 2) {
        const name = form.username.trim().toLowerCase()
        if (!USERNAME_RE.test(name)) throw new Error("Choose a valid username")
        const d = await api("/api/auth/check-username", { method: "POST", body: { username: name } })
        if (!d.available) throw new Error("That username is taken. Try another.")
        if (form.password.length < 8) throw new Error("Password must be at least 8 characters")
        if (new TextEncoder().encode(form.password).length > 72) throw new Error("Password is too long (72 bytes max)")
      }

      if (step === 3 && form.dateOfBirth) {
        const age = (Date.now() - new Date(form.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)
        if (!(age >= 0)) throw new Error("Date of birth can't be in the future")
        if (age < 13) throw new Error("You must be at least 13 years old to join")
      }

      if (step === 4) {
        if (form.rooms.length < minRooms) throw new Error(`Pick at least ${minRooms} rooms`)
        try {
          await api("/api/auth/register", {
            method: "POST",
            body: {
              fullName: form.fullName, nickname: form.nickname, username: form.username.trim().toLowerCase(),
              email: form.email.trim(), password: form.password, bio: form.bio, country: form.country,
              dateOfBirth: form.dateOfBirth, rooms: form.rooms,
            },
          })
        } catch (err) {
          // The 30-minute email proof lapsed while the form was open: verify again.
          if (err instanceof ApiError && /verify your email/i.test(err.message)) {
            setForm((f) => ({ ...f, otp: "" }))
            setStep(1)
            await sendOtp().then(() => setCooldown(RESEND_SECONDS)).catch(() => {})
            throw new Error("Your email verification expired. We sent a fresh code.")
          }
          throw err
        }
        await refresh()
        router.replace("/home")
        return
      }

      setStep((s) => s + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function back() {
    setError("")
    setStep((s) => Math.max(0, s - 1))
  }

  const last = step === STEPS.length - 1

  return (
    <div className="auth-card wide">
      <div className="auth-head">
        <Ghost size={56} float priority />
        <h1>Create your account</h1>
      </div>

      <div className="progress" aria-hidden="true">
        {STEPS.map((s, i) => <i key={s} className={i <= step ? "done" : ""} />)}
      </div>
      <p className="step-label">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>

      <form onSubmit={next} key={step}>
        <div className="step auth-form">
          <FormError>{error}</FormError>

          {step === 0 && (
            <>
              <div>
                <h2>Let’s start with you</h2>
                <p>We’ll email you a code to confirm it’s really you.</p>
              </div>
              <Field label="Full name" autoComplete="name" autoFocus required value={form.fullName} onChange={set("fullName")} />
              <Field label="Email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} />
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <h2>Check your email</h2>
                <p>We sent a 6-digit code to <strong>{form.email.trim()}</strong>. It expires in 10 minutes.</p>
              </div>
              <OtpInput value={form.otp} onChange={(otp) => setForm((f) => ({ ...f, otp }))} autoFocus />
              <div className="form-opts">
                <button type="button" className="link-btn" onClick={() => { setError(""); setForm((f) => ({ ...f, otp: "" })); setStep(0) }}>
                  Change email
                </button>
                <button type="button" className="link-btn" disabled={cooldown > 0} onClick={resend}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2>Pick a username</h2>
                <p>It’s how people find and mention you. Your Space echoes stay anonymous.</p>
              </div>
              <div className="field-group">
                <Field
                  label="Username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  maxLength={20}
                  required
                  value={form.username}
                  onChange={set("username")}
                  error={uname.state === "taken" || uname.state === "invalid" ? uname.message : undefined}
                  ok={uname.state === "ok" ? uname.message : undefined}
                  hint={uname.state === "checking" ? uname.message : undefined}
                />
                {uname.suggestions.length > 0 && (
                  <div className="suggest">
                    <span className="muted">Try:</span>
                    {uname.suggestions.map((s) => (
                      <button type="button" key={s} className="chip" onClick={() => setForm((f) => ({ ...f, username: s }))}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
              <Field label="Nickname (optional)" autoComplete="nickname" maxLength={30} hint="What we call you on your home page" value={form.nickname} onChange={set("nickname")} />
              <PasswordField autoComplete="new-password" required hint="At least 8 characters" value={form.password} onChange={set("password")} />
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h2>A little about you</h2>
                <p>All optional. You can add this later.</p>
              </div>
              <div className="field-group">
                <div className="field-label">
                  <label htmlFor="bio">Bio</label>
                  <span className="muted">{form.bio.length}/200</span>
                </div>
                <textarea id="bio" className="input" rows={3} maxLength={200} autoFocus value={form.bio} onChange={set("bio")} />
              </div>
              <Field label="Country" autoComplete="country-name" maxLength={60} value={form.country} onChange={set("country")} />
              <Field label="Date of birth" type="date" autoComplete="bday" hint="You must be 13 or older" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={set("dateOfBirth")} />
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <h2>Choose your rooms</h2>
                <p>
                  Pick {minRooms > 0 ? `at least ${minRooms}` : "any"} to fill your home feed.{" "}
                  <strong>{form.rooms.length} selected</strong>
                </p>
              </div>
              <input className="input" type="search" aria-label="Search rooms" placeholder="Search rooms…" value={roomQuery} onChange={(e) => setRoomQuery(e.target.value)} />
              <div className="picklist" aria-busy={roomsLoading}>
                {rooms.map((room) => (
                  <label key={room.id} className="pick">
                    <input type="checkbox" checked={form.rooms.includes(room.id)} onChange={() => toggleRoom(room.id)} />
                    <span className="room-icon" style={{ background: roomColor(room.name) }}>{room.name[0].toUpperCase()}</span>
                    <span className="grow">
                      <strong>{room.name}</strong>
                      <small>{room.memberCount} members</small>
                    </span>
                    <span className="tick"><Icon name="check" /></span>
                  </label>
                ))}
                {!roomsLoading && rooms.length === 0 && <p className="muted">No rooms match your search.</p>}
              </div>
            </>
          )}

          <div className="step-actions">
            {step > 0 && <button type="button" className="btn quiet" onClick={back} disabled={loading}>Back</button>}
            <button className="btn primary big" disabled={loading}>
              {loading ? <Spinner /> : last ? "Create account" : "Continue"}
            </button>
          </div>
        </div>
      </form>

      {step === 0 && (
        <p className="auth-foot">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      )}
    </div>
  )
}
