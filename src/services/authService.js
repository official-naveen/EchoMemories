import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { prisma } from "@/libs/prisma"
import { issueSession, signToken, verifyToken, passwordVersion } from "@/libs/auth"
import { generateOTP, hashOTP, safeEqual } from "@/libs/otp"
import { httpError } from "@/libs/http"
import { updateUserActivity } from "@/libs/activity"
import { sendMail } from "@/libs/mailer"
import { codeEmail } from "@/libs/emailTemplates"

export const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RESET_MINUTES = 15
const RESET_MAX_FAILURES = 5

// bcrypt only reads the first 72 bytes, so longer passwords would be silently truncated.
function assertPasswordOk(password) {
  if (password.length < 8) throw httpError(400, "Password must be at least 8 characters")
  if (Buffer.byteLength(password) > 72) throw httpError(400, "Password must be 72 bytes or fewer")
}

// Compared against when the account doesn't exist, so a login attempt takes
// the same time either way and can't be used to discover registered users.
const DUMMY_HASH = "$2b$12$gr56QEeNkZhHmyoTIWyP4eI3SVtklPP.wFLJ1on59FbFwo.KBo0Aa"

const SAFE_USER = {
  id: true,
  fullName: true,
  nickname: true,
  username: true,
  email: true,
  avatar: true,
  bio: true,
  country: true,
  pulseScore: true,
  streakDays: true,
}

export async function registerUser(body = {}) {
  const fullName = String(body.fullName || "").trim()
  const nickname = String(body.nickname || "").trim().slice(0, 30) || null
  const username = String(body.username || "").toLowerCase().trim()
  const email = String(body.email || "").toLowerCase().trim()
  const password = String(body.password || "")
  const bio = String(body.bio || "").trim().slice(0, 200) || null
  const country = String(body.country || "").trim().slice(0, 60) || null
  const roomIds = Array.isArray(body.rooms) ? [...new Set(body.rooms.map(String))].slice(0, 30) : []

  if (fullName.length < 2 || fullName.length > 60) throw httpError(400, "Full name must be 2-60 characters")
  if (!USERNAME_RE.test(username)) throw httpError(400, "Invalid username")
  if (!EMAIL_RE.test(email)) throw httpError(400, "Invalid email")
  assertPasswordOk(password)

  let dateOfBirth = null
  if (body.dateOfBirth) {
    dateOfBirth = new Date(body.dateOfBirth)
    if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth > new Date()) {
      throw httpError(400, "Invalid date of birth")
    }
    const age = (Date.now() - dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000)
    if (age < 13) throw httpError(400, "You must be at least 13 years old")
  }

  // The email must have been verified with an OTP in this browser session.
  const store = await cookies()
  const proof = verifyToken(store.get("email_verified")?.value || "")
  if (!proof || proof.purpose !== "email-verified" || proof.email !== email) {
    throw httpError(400, "Please verify your email first")
  }

  const [emailTaken, nameTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
  ])
  if (emailTaken) throw httpError(409, "Email already registered")
  if (nameTaken) throw httpError(409, "Username already taken")

  const rooms = roomIds.length
    ? await prisma.room.findMany({ where: { id: { in: roomIds }, isPublic: true }, select: { id: true } })
    : []

  const passwordHash = await bcrypt.hash(password, 12)

  const created = await prisma.user.create({
    data: {
      fullName,
      nickname,
      username,
      email,
      passwordHash,
      bio,
      country,
      dateOfBirth,
      roomMemberships: { create: rooms.map((r) => ({ roomId: r.id })) },
    },
    select: SAFE_USER,
  })

  await updateUserActivity(created.id)
  const session = issueSession({ id: created.id, passwordHash })
  return { user: created, ...session }
}

export async function loginUser(body = {}) {
  const identifier = String(body.identifier || "").toLowerCase().trim()
  const password = String(body.password || "")

  if (!identifier || !password) throw httpError(400, "Email/username and password are required")

  const found = await prisma.user.findFirst({
    where: identifier.includes("@") ? { email: identifier } : { username: identifier },
    select: { ...SAFE_USER, passwordHash: true },
  })

  const ok = await bcrypt.compare(password, found ? found.passwordHash : DUMMY_HASH)
  if (!found || !ok) throw httpError(401, "Invalid credentials")

  await updateUserActivity(found.id)

  const { passwordHash, ...user } = found
  return { user, ...issueSession({ id: user.id, passwordHash }, body.remember === true) }
}

/* ------------------------------------------------------------------ */
/*  Password reset                                                     */
/* ------------------------------------------------------------------ */

// Step 1. Always returns a signed cookie value, whether or not the account
// exists, so the response never reveals which emails are registered.
// `send` (only set for real accounts) delivers the email after the response.
export async function createPasswordReset(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  })

  const otp = generateOTP()
  const cookieValue = signToken(
    {
      purpose: "password-reset",
      email,
      otpHash: hashOTP(otp, email),
      // Binds the code to the current password: once it changes, the code is dead.
      pv: user ? passwordVersion(user.passwordHash) : "none",
    },
    `${RESET_MINUTES}m`
  )

  const send = user
    ? () =>
        sendMail({
          to: email,
          subject: "Reset your EchoMemories password",
          html: codeEmail({
            heading: "Reset your password",
            intro: "Use this code to choose a new password for your EchoMemories account.",
            code: otp,
            minutes: RESET_MINUTES,
          }),
        })
    : null

  return { cookieValue, send }
}

// Step 2. Checks the emailed code, then sets the new password.
export async function completePasswordReset({ otp, password, cookieValue }) {
  const code = String(otp || "").trim()
  const next = String(password || "")
  if (!/^\d{6}$/.test(code)) throw httpError(400, "Enter the 6-digit code from your email")
  assertPasswordOk(next)

  const data = verifyToken(cookieValue || "")
  if (!data || data.purpose !== "password-reset") {
    throw httpError(400, "This code has expired. Request a new one.")
  }

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true, passwordHash: true },
  })

  // Wrong guesses are stored in the database, so the limit holds across
  // restarts and across several server instances.
  if (user) {
    const since = new Date(Date.now() - RESET_MINUTES * 60 * 1000)
    const failures = await prisma.userLog.count({
      where: { userId: user.id, action: "reset_failed", createdAt: { gte: since } },
    })
    if (failures >= RESET_MAX_FAILURES) {
      throw httpError(429, "Too many wrong codes. Please wait a few minutes and request a new code.")
    }
  }

  const valid =
    safeEqual(hashOTP(code, data.email), data.otpHash) &&
    user &&
    passwordVersion(user.passwordHash) === data.pv

  if (!valid) {
    if (user) await prisma.userLog.create({ data: { userId: user.id, action: "reset_failed" } })
    throw httpError(400, "That code isn't right, or it has expired.")
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  })
  await prisma.userLog.create({ data: { userId: user.id, action: "password_reset" } })
  return { reset: true }
}
