import { prisma } from "@/libs/prisma"
import { rateLimit, tooManyRequests } from "@/libs/rateLimit"
import { route } from "@/libs/route"

// Suggestions while typing "@name" in an echo or reply. Query: ?q=an (1-20 letters).
// Only public profile fields are returned.
export const GET = route(async ({ req, user }) => {
  const limit = rateLimit(`mentions:${user.id}`, 240, 60_000)
  if (limit.limited) return tooManyRequests(limit)

  const q = (new URL(req.url).searchParams.get("q") || "").trim().replace(/^@/, "").toLowerCase()
  if (!/^[a-z0-9_]{1,20}$/.test(q)) return { users: [] }

  const users = await prisma.user.findMany({
    where: { OR: [{ username: { startsWith: q } }, { fullName: { startsWith: q, mode: "insensitive" } }] },
    orderBy: [{ pulseScore: "desc" }, { username: "asc" }],
    take: 6,
    select: { id: true, username: true, fullName: true, avatar: true },
  })
  return { users }
})
