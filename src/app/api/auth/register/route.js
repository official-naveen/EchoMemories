import { errorResponse } from "@/libs/http"
import { NextResponse } from "next/server"
import { registerUser } from "@/services/authService"
import { clearCookie, setCookie } from "@/libs/cookies"
import { clientIp, rateLimit, tooManyRequests } from "@/libs/rateLimit"

export async function POST(req) {
  try {
    const limit = rateLimit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000)
    if (limit.limited) return tooManyRequests(limit)

    const result = await registerUser(await req.json())

    const response = NextResponse.json({ message: "Account created successfully", user: result.user })
    response.cookies.set(setCookie("token", result.token, result.maxAge))
    response.cookies.set(clearCookie("email_verified"))
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
