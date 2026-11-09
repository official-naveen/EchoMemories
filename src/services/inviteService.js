import crypto from "node:crypto"
import { prisma } from "@/libs/prisma"
import { httpError } from "@/libs/http"
import { USERNAME_RE } from "@/services/authService"
import { createNotification } from "@/services/notificationService"
import { requireAdmin } from "@/services/roomAccess"

const MAX_PENDING_PER_ROOM = 100
const LINK_DAYS = 7

const USER_CARD = { id: true, username: true, fullName: true, avatar: true }

/* ------------------------------------------------------------------ */
/*  Find people to invite                                              */
/* ------------------------------------------------------------------ */

// Search by username or name. Never returns emails. When `roomId` is given
// and the caller is an admin of that room, each result says whether the person
// is already a member or already has a pending invite.
export async function searchUsers(viewerId, { q = "", roomId = "" } = {}) {
  const term = String(q).trim().replace(/^@/, "").slice(0, 30)
  if (term.length < 2) return { users: [] }

  const users = await prisma.user.findMany({
    where: {
      id: { not: viewerId },
      OR: [
        { username: { contains: term, mode: "insensitive" } },
        { fullName: { contains: term, mode: "insensitive" } },
      ],
    },
    orderBy: [{ pulseScore: "desc" }, { username: "asc" }],
    take: 8,
    select: USER_CARD,
  })

  let status = new Map()
  if (roomId && users.length) {
    await requireAdmin(viewerId, roomId) // only admins may probe a room's membership
    const ids = users.map((u) => u.id)
    const [members, invites] = await Promise.all([
      prisma.roomMember.findMany({ where: { roomId, userId: { in: ids } }, select: { userId: true } }),
      prisma.roomInvite.findMany({
        where: { roomId, invitedUserId: { in: ids }, status: "PENDING" },
        select: { invitedUserId: true },
      }),
    ])
    invites.forEach((i) => status.set(i.invitedUserId, "invited"))
    members.forEach((m) => status.set(m.userId, "member"))
  }

  return { users: users.map((u) => ({ ...u, status: status.get(u.id) || null })) }
}

/* ------------------------------------------------------------------ */
/*  Direct invites (admin -> one person)                               */
/* ------------------------------------------------------------------ */

export async function createInvite(actorId, roomId, body = {}) {
  const { room } = await requireAdmin(actorId, roomId)

  const username = String(body.username || "").trim().replace(/^@/, "").toLowerCase()
  if (!USERNAME_RE.test(username)) throw httpError(400, "Enter a valid username")

  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } })
  if (!target) throw httpError(404, `No user with the username @${username}`)
  if (target.id === actorId) throw httpError(400, "You are already in this room")

  const [member, existing, pendingCount, actor] = await Promise.all([
    prisma.roomMember.findUnique({
      where: { userId_roomId: { userId: target.id, roomId } },
      select: { id: true },
    }),
    prisma.roomInvite.findUnique({
      where: { roomId_invitedUserId: { roomId, invitedUserId: target.id } },
      select: { status: true },
    }),
    prisma.roomInvite.count({ where: { roomId, status: "PENDING" } }),
    prisma.user.findUnique({ where: { id: actorId }, select: { fullName: true } }),
  ])
  if (member) throw httpError(409, `@${username} is already a member`)
  if (existing?.status === "PENDING") throw httpError(409, `@${username} already has a pending invite`)
  if (pendingCount >= MAX_PENDING_PER_ROOM) {
    throw httpError(400, `This room already has ${MAX_PENDING_PER_ROOM} pending invites. Revoke some first.`)
  }

  // One row per (room, person): re-inviting resets the old row to PENDING.
  const invite = await prisma.roomInvite.upsert({
    where: { roomId_invitedUserId: { roomId, invitedUserId: target.id } },
    create: { roomId, invitedUserId: target.id, invitedById: actorId },
    update: { status: "PENDING", invitedById: actorId, createdAt: new Date(), respondedAt: null },
    select: inviteSelectForAdmin,
  })

  await createNotification(target.id, `${actor?.fullName || "Someone"} invited you to join ${room.name}`, {
    type: "invite",
    link: "/rooms?tab=invites",
  })
  return invite
}

const inviteSelectForAdmin = {
  id: true,
  status: true,
  createdAt: true,
  invitedUser: { select: USER_CARD },
  invitedBy: { select: { id: true, username: true, fullName: true } },
}

export async function listRoomInvites(actorId, roomId) {
  await requireAdmin(actorId, roomId)
  const invites = await prisma.roomInvite.findMany({
    where: { roomId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: MAX_PENDING_PER_ROOM,
    select: inviteSelectForAdmin,
  })
  return { invites }
}

export async function revokeInvite(actorId, roomId, inviteId) {
  await requireAdmin(actorId, roomId)
  const r = await prisma.roomInvite.updateMany({
    where: { id: inviteId, roomId, status: "PENDING" },
    data: { status: "REVOKED", respondedAt: new Date() },
  })
  if (!r.count) throw httpError(404, "Invite not found or already answered")
  return { revoked: true }
}

/* ------------------------------------------------------------------ */
/*  Invites I received                                                 */
/* ------------------------------------------------------------------ */

export async function listMyInvites(userId) {
  const rows = await prisma.roomInvite.findMany({
    where: { invitedUserId: userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      invitedBy: { select: { id: true, username: true, fullName: true } },
      room: {
        select: { id: true, name: true, description: true, isPublic: true, _count: { select: { members: true } } },
      },
    },
  })
  return {
    count: rows.length,
    invites: rows.map((i) => ({
      id: i.id,
      createdAt: i.createdAt,
      invitedBy: i.invitedBy,
      room: {
        id: i.room.id,
        name: i.room.name,
        description: i.room.description,
        isPublic: i.room.isPublic,
        memberCount: i.room._count.members,
      },
    })),
  }
}

// action: "accept" | "decline". Only the invited person can answer.
export async function respondToInvite(userId, inviteId, body = {}) {
  const action = body.action
  if (action !== "accept" && action !== "decline") throw httpError(400, 'action must be "accept" or "decline"')

  const invite = await prisma.roomInvite.findUnique({
    where: { id: inviteId },
    select: { id: true, invitedUserId: true, invitedById: true, roomId: true, room: { select: { id: true, name: true } } },
  })
  if (!invite || invite.invitedUserId !== userId) throw httpError(404, "Invite not found")

  // Claim the invite atomically so a double-click can't process it twice.
  const claimed = await prisma.roomInvite.updateMany({
    where: { id: inviteId, status: "PENDING" },
    data: { status: action === "accept" ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  })
  if (!claimed.count) throw httpError(409, "This invite was already answered or has been withdrawn")

  if (action === "decline") return { status: "DECLINED" }

  await prisma.roomMember.upsert({
    where: { userId_roomId: { userId, roomId: invite.roomId } },
    update: {},
    create: { userId, roomId: invite.roomId, role: "MEMBER" },
  })
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } })
  await createNotification(invite.invitedById, `${me?.fullName || "Someone"} joined ${invite.room.name}`, {
    type: "room",
    link: `/rooms/${invite.roomId}`,
  })
  return { status: "ACCEPTED", room: invite.room }
}

/* ------------------------------------------------------------------ */
/*  Invite link (anyone with the link can join)                        */
/* ------------------------------------------------------------------ */

function linkState(room) {
  const active = !!room.inviteCode && !!room.inviteCodeExpiresAt && room.inviteCodeExpiresAt > new Date()
  return {
    active,
    code: active ? room.inviteCode : null,
    path: active ? `/invite/${room.inviteCode}` : null,
    expiresAt: active ? room.inviteCodeExpiresAt : null,
  }
}

export async function getInviteLink(actorId, roomId) {
  const { room } = await requireAdmin(actorId, roomId, { inviteCode: true, inviteCodeExpiresAt: true })
  return linkState(room)
}

// Creates a fresh link (this also kills the previous one).
export async function createInviteLink(actorId, roomId) {
  await requireAdmin(actorId, roomId)
  const room = await prisma.room.update({
    where: { id: roomId },
    data: {
      inviteCode: crypto.randomBytes(9).toString("base64url"), // 12 URL-safe chars, 72 bits
      inviteCodeExpiresAt: new Date(Date.now() + LINK_DAYS * 24 * 60 * 60 * 1000),
    },
    select: { inviteCode: true, inviteCodeExpiresAt: true },
  })
  return linkState(room)
}

export async function revokeInviteLink(actorId, roomId) {
  await requireAdmin(actorId, roomId)
  await prisma.room.update({ where: { id: roomId }, data: { inviteCode: null, inviteCodeExpiresAt: null } })
  return { active: false }
}

async function roomByCode(code) {
  const clean = String(code || "")
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(clean)) throw httpError(404, "This invite link is invalid or has expired")
  const room = await prisma.room.findUnique({
    where: { inviteCode: clean },
    select: {
      id: true,
      name: true,
      description: true,
      isPublic: true,
      inviteCodeExpiresAt: true,
      createdBy: { select: { username: true, fullName: true } },
      _count: { select: { members: true } },
    },
  })
  if (!room || !room.inviteCodeExpiresAt || room.inviteCodeExpiresAt <= new Date()) {
    throw httpError(404, "This invite link is invalid or has expired")
  }
  return room
}

// What the landing page shows before you press "Join".
export async function previewInviteLink(userId, code) {
  const room = await roomByCode(code)
  const member = userId
    ? await prisma.roomMember.findUnique({ where: { userId_roomId: { userId, roomId: room.id } }, select: { id: true } })
    : null
  return {
    room: {
      id: room.id,
      name: room.name,
      description: room.description,
      isPublic: room.isPublic,
      memberCount: room._count.members,
      createdBy: room.createdBy,
    },
    alreadyMember: !!member,
  }
}

export async function joinByInviteLink(userId, code) {
  const room = await roomByCode(code)
  await prisma.roomMember.upsert({
    where: { userId_roomId: { userId, roomId: room.id } },
    update: {},
    create: { userId, roomId: room.id, role: "MEMBER" },
  })
  // If this person also had a direct invite, it is now settled.
  await prisma.roomInvite.updateMany({
    where: { roomId: room.id, invitedUserId: userId, status: "PENDING" },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  })
  const memberCount = await prisma.roomMember.count({ where: { roomId: room.id } })
  return { joined: true, roomId: room.id, memberCount }
}
