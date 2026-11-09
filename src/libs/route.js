import { NextResponse } from "next/server"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { errorResponse } from "@/libs/http"

// Wraps an API handler so every route gets the same behaviour:
//   1. looks up the logged-in user (401 if `auth` is true and nobody is logged in)
//   2. awaits the dynamic URL params ({ id } from /api/rooms/[id] ...)
//   3. turns anything thrown (httpError, bad JSON, bugs) into a JSON error
//
//   export const GET = route(async ({ req, user, params }) => ({ ok: true }))
//
// The handler may return a plain object (sent as JSON, status 200), a
// NextResponse, or `json(body, status)` for a custom status.
export function route(handler, { auth = true, fallback } = {}) {
  return async (req, context) => {
    try {
      const user = await getUserFromRequest(req)
      if (auth && !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

      const params = (await context?.params) || {}
      const result = await handler({ req, user, params })
      return result instanceof Response ? result : NextResponse.json(result)
    } catch (error) {
      return errorResponse(error, fallback)
    }
  }
}

export const json = (body, status = 200) => NextResponse.json(body, { status })

// Reads a JSON body, treating a missing/empty body as {}.
export async function readBody(req) {
  const text = await req.text()
  return text ? JSON.parse(text) : {}
}
