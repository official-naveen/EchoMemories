"use client"

import { useEffect } from "react"

// Sets the browser tab title for client-rendered pages.
export default function usePageTitle(title) {
  useEffect(() => {
    if (title) document.title = `${title} · EchoMemories`
  }, [title])
}
