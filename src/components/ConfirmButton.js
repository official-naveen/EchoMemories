"use client"

import { useEffect, useState } from "react"

// A two-step button for destructive actions: the first click "arms" it
// (label changes), the second click within 4 seconds does the action.
export default function ConfirmButton({ children, confirmLabel = "Sure?", onConfirm, disabled, className = "btn small danger" }) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <button
      type="button"
      className={`${className}${armed ? " armed" : ""}`}
      disabled={disabled}
      onClick={() => {
        if (!armed) return setArmed(true)
        setArmed(false)
        onConfirm()
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}
