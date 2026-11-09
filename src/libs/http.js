import { NextResponse } from "next/server"

export function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

export function getPagination(req, { defaultLimit = 10, maxLimit = 50 } = {}) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10) || defaultLimit)
  )
  return { page, limit, skip: (page - 1) * limit, searchParams }
}

// Turns any thrown value into a JSON response. Deliberate errors (httpError)
// keep their message; anything unexpected is logged and hidden from the client.
export function errorResponse(error, fallback = "Server error") {
  if (error?.status) return NextResponse.json({ error: error.message }, { status: error.status })
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  console.error(fallback + ":", error)
  return NextResponse.json({ error: fallback }, { status: 500 })
}
