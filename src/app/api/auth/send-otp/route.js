import { errorResponse } from "@/libs/http"
import { NextResponse } from "next/server"
import { generateOTP, hashOTP } from "@/libs/otp"
import { sendMail } from "@/libs/mailer"
import { signToken } from "@/libs/auth"
import { setCookie } from "@/libs/cookies"
import { codeEmail } from "@/libs/emailTemplates"
import { clientIp, rateLimit, tooManyRequests } from "@/libs/rateLimit"
import { prisma } from "@/libs/prisma"
import { EMAIL_RE } from "@/services/authService"

const MINUTES = 10

export async function POST(req) {
  try {
    const { email } = await req.json()
    const cleanEmail = String(email || "").toLowerCase().trim()

    // Per IP (spam) and per address (don't let anyone flood one inbox).
    const byIp = rateLimit(`otp:ip:${clientIp(req)}`, 5, 60_000)
    const byEmail = rateLimit(`otp:email:${cleanEmail}`, 4, 15 * 60_000)
    if (byIp.limited || byEmail.limited) {
      return tooManyRequests(byIp.limited ? byIp : byEmail, "Too many code requests. Please wait a moment and try again.")
    }

    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
    }

    const taken = await prisma.user.findUnique({ where: { email: cleanEmail }, select: { id: true } })
    if (taken) {
      return NextResponse.json({ error: "This email is already registered. Try logging in instead." }, { status: 409 })
    }

    const otp = generateOTP()
    await sendMail({
      to: cleanEmail,
      subject: "Your EchoMemories verification code",
      html: codeEmail({
        heading: "Verify your email",
        intro: "Enter this code to finish creating your EchoMemories account.",
        code: otp,
        minutes: MINUTES,
      }),
    })

    // Signed (tamper-proof) cookie holding only a keyed hash of the code.
    const response = NextResponse.json({ message: "OTP sent" })
    response.cookies.set(
      setCookie("otp_data", signToken({ purpose: "otp", email: cleanEmail, otpHash: hashOTP(otp, cleanEmail) }, `${MINUTES}m`), MINUTES * 60)
    )
    return response
  } catch (error) {
    return errorResponse(error, "We couldn't send the code. Please try again.")
  }
}
