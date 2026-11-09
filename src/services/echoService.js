import { prisma } from "@/libs/prisma"
import { httpError } from "@/libs/http"
import { extractMentions } from "@/libs/mentions"
import { createNotification } from "@/services/notificationService"
import { bumpPulse } from "@/services/pulseService"
import { decorateEchoes, loadViewableEcho } from "@/services/echoView"
import { isRoomAdmin } from "@/services/roomAccess"

function clean(body = {}) {
  const content = typeof body.content === "string" ? body.content.trim() : ""
  const title = typeof body.title === "string" ? body.title.trim() : ""
  if (!content) throw httpError(400, "Content is required")
  if (content.length > 5000) throw httpError(400, "Content must be 5000 characters or less")
  if (title.length > 120) throw httpError(400, "Title must be 120 characters or less")
  return { content, title: title || null }
}

async function notifyMentions({ echo, authorId, authorName, isSpace, roomName }) {
  const names = extractMentions(echo.content)
  if (!names.length) return

  const users = await prisma.user.findMany({
    where: { username: { in: names }, id: { not: authorId } },
    select: { id: true },
  })

  for (const u of users) {
    await prisma.mention.create({ data: { echoId: echo.id, mentionedUserId: u.id } })
    const who = isSpace ? "Someone" : authorName
    const where = isSpace ? "in Space" : `in ${roomName}`
    await createNotification(u.id, `${who} mentioned you ${where}`, { type: "mention", link: `/echo/${echo.id}` })
    await bumpPulse(u.id, 0.2)
  }
}

export async function createEcho(userId, body) {
  const { content, title } = clean(body)
  const roomId = body.roomId || null

  let room = null
  if (roomId) {
    room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) throw httpError(404, "Room not found")

    const isMember = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
      select: { id: true },
    })
    if (!isMember && room.createdById !== userId) throw httpError(403, "Join this room before posting")
  }

  const created = await prisma.echo.create({
    data: { title, content, authorId: userId, roomId: room ? room.id : null, isInSpace: !room },
    select: { id: true, content: true },
  })

  const author = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } })
  await notifyMentions({
    echo: created,
    authorId: userId,
    authorName: author?.fullName || "Someone",
    isSpace: !room,
    roomName: room?.name,
  })
  await bumpPulse(userId, 0.5)
  await prisma.userLog.create({ data: { userId, action: room ? "echo_room" : "echo_space" } })

  return getEchoById(created.id, userId)
}

export async function getEchoById(id, viewerId) {
  const row = await loadViewableEcho(id, viewerId)
  const [echo] = await decorateEchoes([row], viewerId)
  return echo
}

export async function updateEcho(userId, id, body) {
  const echo = await prisma.echo.findUnique({ where: { id }, select: { authorId: true } })
  if (!echo) throw httpError(404, "Echo not found")
  if (echo.authorId !== userId) throw httpError(403, "You can only edit your own echoes")

  const { content, title } = clean({ title: body.title, content: body.content })
  await prisma.echo.update({ where: { id }, data: { content, title } })
  return getEchoById(id, userId)
}

export async function deleteEcho(userId, id) {
  const echo = await prisma.echo.findUnique({
    where: { id },
    select: { authorId: true, room: { select: { id: true, createdById: true } } },
  })
  if (!echo) throw httpError(404, "Echo not found")

  // The author may delete their echo; so may an admin of the room it lives in (moderation).
  const allowed = echo.authorId === userId || (echo.room && (await isRoomAdmin(userId, echo.room)))
  if (!allowed) throw httpError(403, "You can only delete your own echoes")

  // The schema has no cascading deletes, so remove children first.
  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { echoId: id } }),
    prisma.resonation.deleteMany({ where: { echoId: id } }),
    prisma.save.deleteMany({ where: { echoId: id } }),
    prisma.mention.deleteMany({ where: { echoId: id } }),
    prisma.echo.delete({ where: { id } }),
  ])
  return { deleted: true }
}
