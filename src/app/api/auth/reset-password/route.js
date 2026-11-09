import { errorResponse } from "@/libs/http"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { completePasswordReset } from "@/services/authService"
import { clientIp, rateLimit, tooManyRequests } from "@/libs/rateLimit"
import { clearCookie } from "@/libs/cookies"

export async function POST(req) {
  try {
    const limit = rateLimit(`reset:ip:${clientIp(req)}`, 15, 15 * 60_000)
    if (limit.limited) return tooManyRequests(limit)

    const { otp, password } = await req.json()
    const store = await cookies()

    await completePasswordReset({ otp, password, cookieValue: store.get("reset_data")?.value })

    // Other sessions die on their own (they are bound to the old password).
    // Also sign this browser out so the person logs in fresh.
    const response = NextResponse.json({ message: "Password updated" })
    response.cookies.set(clearCookie("reset_data"))
    response.cookies.set(clearCookie("token"))
    return response
  } catch (error) {
    return errorResponse(error, "Something went wrong. Please try again.")
  }
}
