import { prisma } from "@/libs/prisma"
import { getPagination } from "@/libs/http"
import { ECHO_SELECT, decorateEchoes } from "@/services/echoView"

function orderFor(sort) {
  if (sort === "discussed") return [{ comments: { _count: "desc" } }, { createdAt: "desc" }]
  if (sort === "resonated") return [{ resonations: { _count: "desc" } }, { createdAt: "desc" }]
  return [{ createdAt: "desc" }]
}

async function paged(req, where, viewerId) {
  const { page, limit, skip, searchParams } = getPagination(req, { defaultLimit: 10, maxLimit: 30 })
  const sort = (searchParams.get("sort") || "latest").toLowerCase()

  const rows = await prisma.echo.findMany({
    where,
    orderBy: orderFor(sort),
    skip,
    take: limit + 1,
    select: ECHO_SELECT,
  })

  const hasMore = rows.length > limit
  const echoes = await decorateEchoes(rows.slice(0, limit), viewerId)
  return { page, limit, hasMore, echoes }
}

// Echoes from every room the user has joined (plus their own).
export async function getHomeFeed(req, userId) {
  const memberships = await prisma.roomMember.findMany({ where: { userId }, select: { roomId: true } })
  const roomIds = memberships.map((m) => m.roomId)

  return paged(req, { OR: [{ roomId: { in: roomIds } }, { authorId: userId }] }, userId)
}

// Anonymous global feed.
export async function getSpaceFeed(req, userId) {
  return paged(req, { isInSpace: true }, userId)
}

// Most engaged echoes of the last 7 days from Space and public rooms.
export async function getTrendingFeed(userId) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const rows = await prisma.echo.findMany({
    where: { createdAt: { gte: since }, OR: [{ isInSpace: true }, { room: { isPublic: true } }] },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: ECHO_SELECT,
  })

  const score = (e) => e._count.resonations * 2 + e._count.comments * 3 + e._count.saves * 1.5
  const top = rows
    .filter((e) => score(e) > 0)
    .sort((a, b) => score(b) - score(a) || b.createdAt - a.createdAt)
    .slice(0, 20)

  return { echoes: await decorateEchoes(top, userId) }
}
