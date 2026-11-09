import { errorResponse } from "@/libs/http"
import { NextResponse } from "next/server"
import { loginUser } from "@/services/authService"
import { setCookie } from "@/libs/cookies"
import { clientIp, rateLimit, tooManyRequests } from "@/libs/rateLimit"

const TEN_MINUTES = 10 * 60 * 1000

export async function POST(req) {
  try {
    const body = await req.json()

    // Throttle by IP and by account so neither one machine nor a botnet can
    // grind through passwords for a single user.
    const byIp = rateLimit(`login:ip:${clientIp(req)}`, 30, TEN_MINUTES)
    const identifier = String(body?.identifier || "").toLowerCase().trim().slice(0, 100)
    const byAccount = rateLimit(`login:id:${identifier}`, 8, TEN_MINUTES)
    if (byIp.limited || byAccount.limited) {
      return tooManyRequests(byIp.limited ? byIp : byAccount, "Too many login attempts. Please try again in a few minutes.")
    }

    const { user, token, maxAge } = await loginUser(body)

    const response = NextResponse.json({ user })
    response.cookies.set(setCookie("token", token, maxAge))
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
