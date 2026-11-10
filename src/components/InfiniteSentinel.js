"use client"

import { useEffect, useRef } from "react"

// Calls `onVisible` when this element scrolls near the viewport. Render it only
// while more pages exist and nothing is loading, so each page is requested once.
export default function InfiniteSentinel({ onVisible, loading }) {
  const ref = useRef(null)
  const callback = useRef(onVisible)
  callback.current = onVisible

  useEffect(() => {
    const node = ref.current
    if (!node || loading) return
    if (typeof IntersectionObserver === "undefined") {
      callback.current()
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) callback.current()
      },
      { rootMargin: "400px 0px" }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [loading])

  return (
    <div ref={ref} className="more-loader" aria-live="polite">
      {loading ? <span className="spinner" role="status" aria-label="Loading more" /> : null}
    </div>
  )
}
