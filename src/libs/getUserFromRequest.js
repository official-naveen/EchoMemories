import { prisma } from "@/libs/prisma"
import { verifyToken, passwordVersion } from "@/libs/auth"

const BASE_SELECT = {
  id: true,
  fullName: true,
  nickname: true,
  username: true,
  email: true,
  avatar: true,
  pulseScore: true,
  streakDays: true,
  lastActiveDate: true,
}

// Returns the logged-in user or null. Reads the httpOnly session cookie
// (or an `Authorization: Bearer` header). `extraSelect` lets a route load more
// fields in the same query. Database errors are NOT swallowed: an outage must
// surface as a 5xx, never as "you are logged out".
export async function getUserFromRequest(req, extraSelect = {}) {
  let token = req.cookies?.get?.("token")?.value
  if (!token) {
    const bearer = req.headers?.get?.("authorization")
    if (bearer?.startsWith("Bearer ")) token = bearer.slice(7)
  }
  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded?.userId || !decoded.pv) return null

  const found = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { ...BASE_SELECT, ...extraSelect, passwordHash: true },
  })
  if (!found || passwordVersion(found.passwordHash) !== decoded.pv) return null

  const { passwordHash: _hash, ...user } = found
  return user
}
