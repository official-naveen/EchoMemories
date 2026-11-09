"use client"

import { useId, useState } from "react"
import Icon from "@/components/Icon"

export function Field({ label, hint, error, ok, right, id, ...props }) {
  const auto = useId()
  const fid = id || auto
  const note = error || ok || hint
  return (
    <div className="field-group">
      <div className="field-label">
        <label htmlFor={fid}>{label}</label>
        {right}
      </div>
      <input id={fid} className="input" aria-invalid={error ? "true" : undefined} aria-describedby={note ? `${fid}-note` : undefined} {...props} />
      {note && <p id={`${fid}-note`} className={`field-msg${error ? " error" : ok ? " ok" : ""}`}>{note}</p>}
    </div>
  )
}

export function PasswordField({ label = "Password", hint, error, right, id, ...props }) {
  const auto = useId()
  const fid = id || auto
  const [shown, setShown] = useState(false)
  const note = error || hint
  return (
    <div className="field-group">
      <div className="field-label">
        <label htmlFor={fid}>{label}</label>
        {right}
      </div>
      <div className="input-wrap">
        <input id={fid} className="input" type={shown ? "text" : "password"} aria-invalid={error ? "true" : undefined} aria-describedby={note ? `${fid}-note` : undefined} {...props} />
        <button type="button" className="reveal" onClick={() => setShown((s) => !s)} aria-label={shown ? "Hide password" : "Show password"}>
          <Icon name={shown ? "eyeOff" : "eye"} />
        </button>
      </div>
      {note && <p id={`${fid}-note`} className={`field-msg${error ? " error" : ""}`}>{note}</p>}
    </div>
  )
}

// One input, not six boxes: pasting and SMS/email autofill just work.
export function OtpInput({ value, onChange, label = "6-digit code", ...props }) {
  const id = useId()
  return (
    <div className="field-group">
      <label className="sr-only" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="······"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        {...props}
      />
    </div>
  )
}

export function FormError({ children }) {
  return children ? <div className="alert" role="alert">{children}</div> : null
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />
}
