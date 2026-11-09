import { NextResponse } from "next/server"

// Small in-memory fixed-window rate limiter shared by every route.
// State lives in the server process: it resets on restart and is not shared
// between instances. For a multi-instance deployment swap the Map for Redis.
const buckets = new Map()
const MAX_BUCKETS = 100_000
let lastSweep = 0

function sweep(now) {
  if (now - lastSweep < 60_000 && buckets.size < MAX_BUCKETS) return
  lastSweep = now
  for (const [key, bucket] of buckets) if (bucket.reset <= now) buckets.delete(key)
  if (buckets.size >= MAX_BUCKETS) buckets.clear()
}

// Counts one hit for `key`. Returns { limited, retryAfter (seconds) }.
export function rateLimit(key, limit, windowMs) {
  const now = Date.now()
  sweep(now)
  let bucket = buckets.get(key)
  if (!bucket || bucket.reset <= now) {
    bucket = { count: 0, reset: now + windowMs }
    buckets.set(key, bucket)
  }
  bucket.count++
  return { limited: bucket.count > limit, retryAfter: Math.max(1, Math.ceil((bucket.reset - now) / 1000)) }
}

export function clientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for")
  return (forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown").trim()
}

export function tooManyRequests(result, message = "Too many requests. Please try again shortly.") {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
  )
}
