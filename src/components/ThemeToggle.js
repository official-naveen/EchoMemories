"use client"

import { useEffect } from "react"
import Icon from "@/components/Icon"

export const THEME_KEY = "em-theme"

// Runs before first paint (see layout.js) so there is no light-mode flash.
export const themeInitScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}`

export default function ThemeToggle() {
  // Until the person picks a theme explicitly, follow the operating system live.
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)")
    const follow = () => {
      try {
        if (localStorage.getItem(THEME_KEY)) return
      } catch {}
      document.documentElement.dataset.theme = mq.matches ? "dark" : "light"
    }
    mq.addEventListener("change", follow)
    return () => mq.removeEventListener("change", follow)
  }, [])

  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark"
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {}
  }

  // Both icons are rendered; CSS shows the right one, so SSR and client always match.
  return (
    <button className="icon-btn theme-toggle" onClick={toggle} aria-label="Toggle dark mode" title="Toggle theme">
      <Icon name="moon" className="moon" />
      <Icon name="sun" className="sun" />
    </button>
  )
}
