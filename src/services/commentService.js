import { prisma } from "@/libs/prisma"
import { httpError, getPagination } from "@/libs/http"
import { createNotification } from "@/services/notificationService"
import { bumpPulse } from "@/services/pulseService"
import { loadViewableEcho } from "@/services/echoView"
import { isRoomAdmin } from "@/services/roomAccess"

function cleanContent(body = {}) {
  const content = typeof body.content === "string" ? body.content.trim() : ""
  if (!content) throw httpError(400, "Comment cannot be empty")
  if (content.length > 1000) throw httpError(400, "Comment must be 1000 characters or less")
  return content
}

const COMMENT_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  echoId: true,
  authorId: true,
  author: { select: { id: true, username: true, fullName: true, pulseScore: true } },
}

// Space echoes are anonymous. If the echo's author replies to their own
// echo, their name must not appear next to the reply or it would unmask them.
function shape(comment, echo, viewerId) {
  const isOP = comment.authorId === echo.authorId
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    echoId: comment.echoId,
    isMine: !!viewerId && comment.authorId === viewerId,
    isOP,
    author: echo.isInSpace && isOP ? null : comment.author,
  }
}

export async function listComments(req, echoId, viewerId) {
  // Throws 404/403 for missing echoes and for private rooms the viewer isn't in.
  const echo = await loadViewableEcho(echoId, viewerId, { id: true, authorId: true, isInSpace: true })
  const { page, limit, skip } = getPagination(req, { defaultLimit: 50, maxLimit: 100 })

  const rows = await prisma.comment.findMany({
    where: { echoId },
    orderBy: { createdAt: "asc" },
    skip,
    take: limit + 1,
    select: COMMENT_SELECT,
  })

  return {
    page,
    limit,
    hasMore: rows.length > limit,
    comments: rows.slice(0, limit).map((c) => shape(c, echo, viewerId)),
  }
}

export async function createComment(userId, body = {}) {
  const content = cleanContent(body)
  const echo = await loadViewableEcho(body.echoId, userId, { id: true, authorId: true, isInSpace: true })

  const comment = await prisma.comment.create({
    data: { content, echoId: echo.id, authorId: userId },
    select: COMMENT_SELECT,
  })

  if (echo.authorId !== userId) {
    await createNotification(echo.authorId, `${comment.author.fullName} commented on your echo`, {
      type: "comment",
      link: `/echo/${echo.id}`,
    })
    await bumpPulse(echo.authorId, 0.1)
  }
  await bumpPulse(userId, 0.2)

  return shape(comment, echo, userId)
}

export async function updateComment(userId, id, body = {}) {
  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, echo: { select: { id: true, authorId: true, isInSpace: true } } },
  })
  if (!existing) throw httpError(404, "Comment not found")
  if (existing.authorId !== userId) throw httpError(403, "You can only edit your own comments")

  const comment = await prisma.comment.update({
    where: { id },
    data: { content: cleanContent(body) },
    select: COMMENT_SELECT,
  })
  return shape(comment, existing.echo, userId)
}

export async function deleteComment(userId, id) {
  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, echo: { select: { authorId: true, room: { select: { id: true, createdById: true } } } } },
  })
  if (!existing) throw httpError(404, "Comment not found")

  // The comment's author, the echo's author, or an admin of the room may remove it.
  const allowed =
    existing.authorId === userId ||
    existing.echo.authorId === userId ||
    (existing.echo.room && (await isRoomAdmin(userId, existing.echo.room)))
  if (!allowed) throw httpError(403, "Not allowed to delete this comment")
  await prisma.comment.delete({ where: { id } })
  return { deleted: true }
}
