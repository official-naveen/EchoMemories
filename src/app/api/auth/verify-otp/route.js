import { errorResponse } from "@/libs/http"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { hashOTP, safeEqual } from "@/libs/otp"
import { signToken, verifyToken } from "@/libs/auth"
import { clearCookie, setCookie } from "@/libs/cookies"
import { rateLimit, tooManyRequests } from "@/libs/rateLimit"

export async function POST(req) {
  try {
    const { otp } = await req.json()
    if (!otp) return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 })

    const store = await cookies()
    // verifyToken also rejects expired or tampered cookies.
    const data = verifyToken(store.get("otp_data")?.value || "")

    if (!data || data.purpose !== "otp") {
      return NextResponse.json({ error: "This code has expired. Request a new one." }, { status: 400 })
    }

    // At most 5 tries per issued code (in-memory, per server instance).
    const attempts = rateLimit(`otp:verify:${data.otpHash}`, 5, 10 * 60_000)
    if (attempts.limited) {
      const response = tooManyRequests(attempts, "Too many wrong attempts. Request a new code.")
      response.cookies.set(clearCookie("otp_data"))
      return response
    }

    if (!safeEqual(hashOTP(otp, data.email), data.otpHash)) {
      return NextResponse.json({ error: "That code isn't right" }, { status: 400 })
    }

    const response = NextResponse.json({ verified: true, email: data.email })
    // Proof of verification, checked again by /api/auth/register.
    response.cookies.set(setCookie("email_verified", signToken({ purpose: "email-verified", email: data.email }, "30m"), 30 * 60))
    response.cookies.set(clearCookie("otp_data"))
    return response
  } catch (error) {
    return errorResponse(error, "Verification failed. Please try again.")
  }
}
