import { prisma } from "@/libs/prisma"
import { httpError, getPagination } from "@/libs/http"
import { extractMentions } from "@/libs/mentions"
import { createNotification } from "@/services/notificationService"
import { bumpPulse } from "@/services/pulseService"
import { loadViewableEcho } from "@/services/echoView"
import { isRoomAdmin } from "@/services/roomAccess"

const ECHO_FIELDS = { id: true, authorId: true, isInSpace: true, isAnonymous: true }

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
  editedAt: true,
  echoId: true,
  parentId: true,
  isAnonymous: true,
  authorId: true,
  author: { select: { id: true, username: true, fullName: true, pulseScore: true } },
}

// A reply is shown without a name when it was posted anonymously. On an
// anonymous echo the original poster is always hidden too, otherwise their
// name next to a reply would unmask them.
function shape(comment, echo, viewerId) {
  const isOP = comment.authorId === echo.authorId
  const hidden = comment.isAnonymous || (echo.isAnonymous && isOP)
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    editedAt: comment.editedAt,
    echoId: comment.echoId,
    parentId: comment.parentId,
    isAnonymous: hidden,
    isMine: !!viewerId && comment.authorId === viewerId,
    isOP,
    author: hidden ? null : comment.author,
  }
}

// Replies come oldest first, so a reply always appears after the one it answers.
// The page builds the thread from `parentId`.
export async function listComments(req, echoId, viewerId) {
  // Throws 404/403 for missing echoes and for private rooms the viewer isn't in.
  const echo = await loadViewableEcho(echoId, viewerId, ECHO_FIELDS)
  const { page, limit, skip } = getPagination(req, { defaultLimit: 100, maxLimit: 200 })

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
  const echo = await loadViewableEcho(body.echoId, userId, ECHO_FIELDS)

  let parent = null
  if (body.parentId) {
    parent = await prisma.comment.findUnique({
      where: { id: String(body.parentId) },
      select: { id: true, echoId: true, authorId: true },
    })
    if (!parent || parent.echoId !== echo.id) throw httpError(404, "The reply you are answering was not found")
  }

  // Default: anonymous on anonymous echoes, named elsewhere. The original poster
  // of an anonymous echo can never reply under their name.
  let anonymous = typeof body.anonymous === "boolean" ? body.anonymous : echo.isAnonymous
  if (echo.isAnonymous && echo.authorId === userId) anonymous = true
  if (anonymous && echo.room && echo.room.allowAnonymous === false) {
    throw httpError(400, "This room doesn't allow anonymous replies")
  }

  const comment = await prisma.comment.create({
    data: { content, echoId: echo.id, authorId: userId, parentId: parent?.id ?? null, isAnonymous: anonymous },
    select: COMMENT_SELECT,
  })

  const who = anonymous ? "Someone" : comment.author.fullName
  const link = `/echo/${echo.id}`
  const notified = new Set([userId])

  // The person being answered hears first; the echo's author is told about the rest.
  if (parent && !notified.has(parent.authorId)) {
    notified.add(parent.authorId)
    await createNotification(parent.authorId, `${who} replied to your comment`, { type: "comment", link })
    await bumpPulse(parent.authorId, 0.1)
  }
  if (!notified.has(echo.authorId)) {
    notified.add(echo.authorId)
    await createNotification(echo.authorId, `${who} commented on your echo`, { type: "comment", link })
    await bumpPulse(echo.authorId, 0.1)
  }

  const names = extractMentions(content)
  if (names.length) {
    const users = await prisma.user.findMany({ where: { username: { in: names } }, select: { id: true } })
    for (const u of users) {
      if (notified.has(u.id)) continue
      notified.add(u.id)
      await createNotification(u.id, `${who} mentioned you in a reply`, { type: "mention", link })
    }
  }
  await bumpPulse(userId, 0.2)

  return shape(comment, echo, userId)
}

export async function updateComment(userId, id, body = {}) {
  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, content: true, echo: { select: ECHO_FIELDS } },
  })
  if (!existing) throw httpError(404, "Comment not found")
  if (existing.authorId !== userId) throw httpError(403, "You can only edit your own comments")

  const content = cleanContent(body)
  const comment = await prisma.comment.update({
    where: { id },
    data: content === existing.content ? {} : { content, editedAt: new Date() },
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

  // Deleting a reply also removes the replies written under it.
  const ids = [id]
  for (let level = [id]; level.length; ) {
    const children = await prisma.comment.findMany({ where: { parentId: { in: level } }, select: { id: true } })
    level = children.map((c) => c.id)
    ids.push(...level)
  }
  await prisma.comment.deleteMany({ where: { id: { in: ids } } })
  return { deleted: true, removed: ids.length }
}
