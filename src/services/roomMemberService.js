import { prisma } from "@/libs/prisma"
import { httpError, getPagination } from "@/libs/http"
import { createNotification } from "@/services/notificationService"
import { requireAdmin, requireOwner } from "@/services/roomAccess"

const MEMBER_SELECT = {
  role: true,
  joinedAt: true,
  user: { select: { id: true, username: true, fullName: true, avatar: true, pulseScore: true } },
}

// Only the owner and admins can see who is in a room. Owner first, then
// admins, then the rest in the order they joined.
//
// Query params: search, page, limit
export async function listMembers(req, viewerId, roomId) {
  const { room, ...standing } = await requireAdmin(viewerId, roomId)
  const { page, limit, skip, searchParams } = getPagination(req, { defaultLimit: 30, maxLimit: 100 })
  const search = (searchParams.get("search") || "").trim().slice(0, 50)

  const where = {
    roomId,
    ...(search
      ? {
          user: {
            OR: [
              { username: { contains: search, mode: "insensitive" } },
              { fullName: { contains: search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.roomMember.findMany({
      where,
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }, { id: "asc" }], // ADMIN sorts before MEMBER
      skip,
      take: limit + 1,
      select: MEMBER_SELECT,
    }),
    prisma.roomMember.count({ where }),
  ])

  const members = rows.slice(0, limit).map((m) => ({
    id: m.user.id,
    username: m.user.username,
    fullName: m.user.fullName,
    avatar: m.user.avatar,
    pulseScore: m.user.pulseScore,
    role: m.user.id === room.createdById ? "OWNER" : m.role,
    joinedAt: m.joinedAt,
    isMe: m.user.id === viewerId,
  }))
  // The owner is pinned to the top of the first page.
  members.sort((a, b) => (b.role === "OWNER") - (a.role === "OWNER"))

  return {
    page,
    limit,
    hasMore: rows.length > limit,
    total,
    viewer: { role: standing.role, isAdmin: standing.isAdmin, isOwner: standing.isOwner },
    members,
  }
}

async function loadTarget(roomId, targetUserId) {
  if (!targetUserId || typeof targetUserId !== "string") throw httpError(400, "User id required")
  const target = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: targetUserId, roomId } },
    select: { id: true, role: true },
  })
  if (!target) throw httpError(404, "That person is not a member of this room")
  return target
}

// Owner only: promote a member to ADMIN, or demote an admin back to MEMBER.
export async function setMemberRole(actorId, roomId, targetUserId, body = {}) {
  const { room } = await requireOwner(actorId, roomId)
  const role = body.role
  if (role !== "ADMIN" && role !== "MEMBER") throw httpError(400, 'role must be "ADMIN" or "MEMBER"')
  if (targetUserId === room.createdById) throw httpError(400, "The owner's role can't be changed")

  const target = await loadTarget(roomId, targetUserId)
  if (target.role === role) return { userId: targetUserId, role }

  await prisma.roomMember.update({ where: { id: target.id }, data: { role } })
  await createNotification(
    targetUserId,
    role === "ADMIN" ? `You are now an admin of ${room.name}` : `You are no longer an admin of ${room.name}`,
    { type: "room", link: `/rooms/${roomId}` }
  )
  return { userId: targetUserId, role }
}

// Admins can remove regular members. Only the owner can remove another admin.
// Nobody can remove the owner. To remove yourself, leave the room instead.
export async function removeMember(actorId, roomId, targetUserId) {
  const { room, isOwner } = await requireAdmin(actorId, roomId)
  if (targetUserId === actorId) throw httpError(400, "Use “Leave room” to remove yourself")
  if (targetUserId === room.createdById) throw httpError(403, "The room owner can't be removed")

  const target = await loadTarget(roomId, targetUserId)
  if (target.role === "ADMIN" && !isOwner) throw httpError(403, "Only the owner can remove another admin")

  await prisma.roomMember.delete({ where: { id: target.id } })
  // Free up the invite row so the person can be invited again later.
  await prisma.roomInvite.updateMany({
    where: { roomId, invitedUserId: targetUserId, status: "ACCEPTED" },
    data: { status: "REVOKED", respondedAt: new Date() },
  })
  await createNotification(targetUserId, `You were removed from ${room.name}`, { type: "room" })

  const memberCount = await prisma.roomMember.count({ where: { roomId } })
  return { removed: true, memberCount }
}

// Owner only: hand the room to another member. The new owner becomes ADMIN;
// the previous owner stays on as an ADMIN (and may now leave).
export async function transferOwnership(actorId, roomId, body = {}) {
  const { room } = await requireOwner(actorId, roomId)
  const newOwnerId = body.userId
  if (newOwnerId === actorId) throw httpError(400, "You already own this room")
  await loadTarget(roomId, newOwnerId)

  await prisma.$transaction([
    prisma.room.update({ where: { id: roomId }, data: { createdById: newOwnerId } }),
    prisma.roomMember.update({
      where: { userId_roomId: { userId: newOwnerId, roomId } },
      data: { role: "ADMIN" },
    }),
    prisma.userLog.create({ data: { userId: actorId, action: "room_transferred" } }),
  ])

  await createNotification(newOwnerId, `You are now the owner of ${room.name}`, { type: "room", link: `/rooms/${roomId}` })
  return { transferred: true, ownerId: newOwnerId }
}
