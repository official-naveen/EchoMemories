import { errorResponse } from "@/libs/http"
import { NextResponse, after } from "next/server"
import { createPasswordReset, EMAIL_RE } from "@/services/authService"
import { clientIp, rateLimit, tooManyRequests } from "@/libs/rateLimit"
import { setCookie } from "@/libs/cookies"

const MINUTES = 15

// Always answers the same way, whether or not the email has an account, so it
// can't be used to find out who is registered.
export async function POST(req) {
  try {
    const { email } = await req.json()
    const cleanEmail = String(email || "").toLowerCase().trim()

    const byIp = rateLimit(`forgot:ip:${clientIp(req)}`, 5, 15 * 60_000)
    const byEmail = rateLimit(`forgot:email:${cleanEmail}`, 3, 15 * 60_000)
    if (byIp.limited || byEmail.limited) {
      return tooManyRequests(byIp.limited ? byIp : byEmail, "Too many requests. Please wait a few minutes and try again.")
    }

    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
    }

    const { cookieValue, send } = await createPasswordReset(cleanEmail)

    // Send after the response so timing doesn't reveal whether the account exists.
    if (send) after(() => send().catch((e) => console.error("RESET MAIL ERROR:", e)))

    const response = NextResponse.json({ message: "If an account exists for that email, a code is on its way." })
    response.cookies.set(setCookie("reset_data", cookieValue, MINUTES * 60))
    return response
  } catch (error) {
    return errorResponse(error, "Something went wrong. Please try again.")
  }
}
