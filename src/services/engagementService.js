import { prisma } from "@/libs/prisma"
import { getPagination } from "@/libs/http"
import { createNotification } from "@/services/notificationService"
import { bumpPulse } from "@/services/pulseService"
import { ECHO_SELECT, decorateEchoes, loadViewableEcho } from "@/services/echoView"

function isUniqueViolation(e) {
  return e?.code === "P2002"
}

export async function toggleResonate(userId, echoId) {
  const echo = await loadViewableEcho(echoId, userId, { id: true, authorId: true })
  const key = { userId_echoId: { userId, echoId } }

  const existing = await prisma.resonation.findUnique({ where: key })
  let resonated

  if (existing) {
    await prisma.resonation.delete({ where: key }).catch(() => {})
    resonated = false
  } else {
    try {
      await prisma.resonation.create({ data: { userId, echoId } })
    } catch (e) {
      if (!isUniqueViolation(e)) throw e
    }
    resonated = true

    if (echo.authorId !== userId) {
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } })
      await createNotification(echo.authorId, `${me?.fullName || "Someone"} resonated with your echo`, {
        type: "resonate",
        link: `/echo/${echoId}`,
      })
      await bumpPulse(echo.authorId, 0.2)
    }
  }

  const count = await prisma.resonation.count({ where: { echoId } })
  return { resonated, count }
}

export async function toggleSave(userId, echoId) {
  await loadViewableEcho(echoId, userId, { id: true })
  const key = { userId_echoId: { userId, echoId } }

  const existing = await prisma.save.findUnique({ where: key })
  let saved

  if (existing) {
    await prisma.save.delete({ where: key }).catch(() => {})
    saved = false
  } else {
    try {
      await prisma.save.create({ data: { userId, echoId } })
    } catch (e) {
      if (!isUniqueViolation(e)) throw e
    }
    saved = true
  }

  const count = await prisma.save.count({ where: { echoId } })
  return { saved, count }
}

export async function getSavedEchoes(req, userId) {
  const { page, limit, skip } = getPagination(req, { defaultLimit: 10, maxLimit: 30 })

  const saves = await prisma.save.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit + 1,
    select: { echo: { select: ECHO_SELECT } },
  })

  const hasMore = saves.length > limit
  // Hide echoes from rooms the user can no longer see.
  const rows = saves
    .slice(0, limit)
    .map((s) => s.echo)
    .filter((e) => !e.room || e.room.isPublic || e.authorId === userId)

  const echoes = await decorateEchoes(rows, userId)
  return { page, limit, hasMore, echoes }
}
