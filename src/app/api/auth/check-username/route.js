import { errorResponse } from "@/libs/http"
import { NextResponse } from "next/server"
import { prisma } from "@/libs/prisma"
import { clientIp, rateLimit, tooManyRequests } from "@/libs/rateLimit"
import { USERNAME_RE } from "@/services/authService"

// Free alternatives that always fit the 3-20 character rule.
function suggest(base) {
  const n = () => Math.floor(10 + Math.random() * 990)
  const trim = (s, extra) => s.slice(0, 20 - extra)
  return [
    `${trim(base, 3)}${n()}`,
    `${trim(base, 4)}_${n()}`,
    `${trim(base, 3)}x${n()}`,
    `its${trim(base, 6)}${n()}`,
    `real${trim(base, 7)}${n()}`,
  ].filter((name) => USERNAME_RE.test(name))
}

export async function POST(req) {
  try {
    const limit = rateLimit(`username:${clientIp(req)}`, 30, 60_000)
    if (limit.limited) return tooManyRequests(limit)

    const { username } = await req.json()
    const name = typeof username === "string" ? username.toLowerCase().trim() : ""

    if (!USERNAME_RE.test(name)) {
      return NextResponse.json({
        available: false,
        error: "Use 3-20 letters, numbers or underscores, starting with a letter",
      })
    }

    const existing = await prisma.user.findUnique({ where: { username: name }, select: { id: true } })
    if (!existing) return NextResponse.json({ available: true })

    const candidates = suggest(name)
    const taken = await prisma.user.findMany({ where: { username: { in: candidates } }, select: { username: true } })
    const takenSet = new Set(taken.map((u) => u.username))

    return NextResponse.json({
      available: false,
      suggestions: candidates.filter((c) => !takenSet.has(c)).slice(0, 3),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
