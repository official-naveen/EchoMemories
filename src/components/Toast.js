"use client"

import { createContext, useCallback, useContext, useState } from "react"

const ToastCtx = createContext(() => {})

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const toast = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2)
    setItems((i) => [...i, { id, message, type }])
    setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
