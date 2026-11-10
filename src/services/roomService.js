import { prisma } from "@/libs/prisma"
import { httpError, getPagination } from "@/libs/http"
import { createNotification } from "@/services/notificationService"
import { loadRoom, requireAdmin, requireOwner } from "@/services/roomAccess"

const ROOM_SELECT = {
  id: true,
  name: true,
  description: true,
  isPublic: true,
  rules: true,
  allowAnonymous: true,
  createdAt: true,
  createdBy: { select: { id: true, username: true, fullName: true } },
  _count: { select: { members: true, echoes: true } },
}

// `roles` is a Map(roomId -> "ADMIN" | "MEMBER") of the viewer's memberships.
function shape(room, roles, viewerId) {
  const isOwner = !!viewerId && room.createdBy.id === viewerId
  const role = isOwner ? "ADMIN" : roles.get(room.id) || null
  return {
    id: room.id,
    name: room.name,
    description: room.description,
    isPublic: room.isPublic,
    rules: room.rules,
    allowAnonymous: room.allowAnonymous,
    createdAt: room.createdAt,
    createdBy: room.createdBy,
    memberCount: room._count.members,
    echoCount: room._count.echoes,
    joined: !!role,
    myRole: role, // "ADMIN" | "MEMBER" | null
    isAdmin: role === "ADMIN",
    isOwner,
  }
}

async function rolesFor(userId, rooms) {
  if (!userId || !rooms.length) return new Map()
  const m = await prisma.roomMember.findMany({
    where: { userId, roomId: { in: rooms.map((r) => r.id) } },
    select: { roomId: true, role: true },
  })
  return new Map(m.map((x) => [x.roomId, x.role]))
}

function cleanRoomFields(body, { partial = false } = {}) {
  const out = {}
  if (!partial || body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (name.length < 3 || name.length > 40) throw httpError(400, "Room name must be 3-40 characters")
    out.name = name
  }
  if (!partial || body.description !== undefined) {
    const description = typeof body.description === "string" ? body.description.trim() : ""
    if (description.length > 200) throw httpError(400, "Description must be 200 characters or less")
    out.description = description || null
  }
  if (!partial || body.rules !== undefined) {
    const rules = typeof body.rules === "string" ? body.rules.trim() : ""
    if (rules.length > 1000) throw httpError(400, "Rules must be 1000 characters or less")
    out.rules = rules || null
  }
  if (body.allowAnonymous !== undefined) {
    if (typeof body.allowAnonymous !== "boolean") throw httpError(400, "allowAnonymous must be true or false")
    out.allowAnonymous = body.allowAnonymous
  }
  if (body.isPublic !== undefined) {
    if (typeof body.isPublic !== "boolean") throw httpError(400, "isPublic must be true or false")
    out.isPublic = body.isPublic
  }
  return out
}

async function assertPublicNameFree(name, exceptId) {
  const clash = await prisma.room.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, isPublic: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  })
  if (clash) throw httpError(409, "A public room with this name already exists")
}

export async function createRoom(userId, body = {}) {
  const { name, description, rules, allowAnonymous } = cleanRoomFields(body)
  const isPublic = body.isPublic === false ? false : true

  if (isPublic) await assertPublicNameFree(name)

  // The creator becomes the owner and its first ADMIN member.
  const room = await prisma.room.create({
    data: {
      name,
      description,
      rules,
      allowAnonymous: allowAnonymous ?? true,
      isPublic,
      createdById: userId,
      members: { create: { userId, role: "ADMIN" } },
    },
    select: ROOM_SELECT,
  })

  await prisma.userLog.create({ data: { userId, action: "room_created" } })
  return shape(room, new Map([[room.id, "ADMIN"]]), userId)
}

// Query params: search, mine=1, random=1, page, limit
export async function getRooms(req, userId) {
  const { page, limit, skip, searchParams } = getPagination(req, { defaultLimit: 12, maxLimit: 50 })
  const search = (searchParams.get("search") || "").trim()
  const mine = searchParams.get("mine") === "1"
  const random = searchParams.get("random") === "1"

  const visibility = userId
    ? { OR: [{ isPublic: true }, { createdById: userId }, { members: { some: { userId } } }] }
    : { isPublic: true }

  const and = [visibility]
  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    })
  }
  if (mine) {
    if (!userId) throw httpError(401, "Unauthorized")
    and.push({ members: { some: { userId } } })
  }
  const where = { AND: and }

  let rows
  if (random) {
    const ids = (await prisma.room.findMany({ where, select: { id: true }, take: 200 })).map((r) => r.id)
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[ids[i], ids[j]] = [ids[j], ids[i]]
    }
    rows = await prisma.room.findMany({ where: { id: { in: ids.slice(0, limit) } }, select: ROOM_SELECT })
  } else {
    rows = await prisma.room.findMany({
      where,
      orderBy: [{ members: { _count: "desc" } }, { createdAt: "desc" }],
      skip,
      take: limit + 1,
      select: ROOM_SELECT,
    })
  }

  const hasMore = !random && rows.length > limit
  const page_rows = random ? rows : rows.slice(0, limit)
  const roles = await rolesFor(userId, page_rows)

  return { page, limit, hasMore, rooms: page_rows.map((r) => shape(r, roles, userId)) }
}

export async function getRoomById(userId, id) {
  const room = await prisma.room.findUnique({ where: { id }, select: ROOM_SELECT })
  if (!room) throw httpError(404, "Room not found")

  const roles = await rolesFor(userId, [room])
  if (!room.isPublic && !roles.has(room.id) && room.createdBy.id !== userId) {
    throw httpError(403, "This private room is only visible to members.")
  }
  return shape(room, roles, userId)
}

// Admins can rename the room and edit its description. Only the owner may
// switch it between public and private.
export async function updateRoom(userId, roomId, body = {}) {
  const { room, isOwner } = await requireAdmin(userId, roomId, { description: true })
  const data = cleanRoomFields(body, { partial: true })
  if (!Object.keys(data).length) throw httpError(400, "Nothing to update")

  if (data.isPublic !== undefined && data.isPublic !== room.isPublic && !isOwner) {
    throw httpError(403, "Only the room owner can change who can see this room")
  }

  const willBePublic = data.isPublic ?? room.isPublic
  const nameChanged = data.name !== undefined && data.name !== room.name
  const becomingPublic = data.isPublic === true && !room.isPublic
  if (willBePublic && (nameChanged || becomingPublic)) await assertPublicNameFree(data.name ?? room.name, room.id)

  const updated = await prisma.room.update({ where: { id: roomId }, data, select: ROOM_SELECT })
  return shape(updated, await rolesFor(userId, [updated]), userId)
}

// Owner only. The schema has no cascading deletes, so everything that hangs
// off the room is removed first, in one transaction.
export async function deleteRoom(userId, roomId) {
  const { room } = await requireOwner(userId, roomId)

  const members = await prisma.roomMember.findMany({
    where: { roomId, userId: { not: userId } },
    select: { userId: true },
  })

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { echo: { roomId } } }),
    prisma.resonation.deleteMany({ where: { echo: { roomId } } }),
    prisma.save.deleteMany({ where: { echo: { roomId } } }),
    prisma.mention.deleteMany({ where: { echo: { roomId } } }),
    prisma.echo.deleteMany({ where: { roomId } }),
    prisma.roomInvite.deleteMany({ where: { roomId } }),
    prisma.roomMember.deleteMany({ where: { roomId } }),
    prisma.room.delete({ where: { id: roomId } }),
    prisma.userLog.create({ data: { userId, action: "room_deleted" } }),
  ])

  await Promise.all(
    members.map((m) => createNotification(m.userId, `The room "${room.name}" was deleted by its owner`, { type: "room" }))
  )
  return { deleted: true }
}

export async function joinRoom(userId, roomId) {
  const room = await loadRoom(roomId)
  if (!room.isPublic) throw httpError(403, "This room is private. You need an invitation to join.")

  await prisma.roomMember.upsert({
    where: { userId_roomId: { userId, roomId } },
    update: {},
    create: { userId, roomId },
  })

  const memberCount = await prisma.roomMember.count({ where: { roomId } })
  return { joined: true, memberCount }
}

export async function leaveRoom(userId, roomId) {
  const room = await loadRoom(roomId)
  if (room.createdById === userId) {
    throw httpError(400, "The owner can't leave. Transfer ownership to another member first, or delete the room.")
  }

  await prisma.roomMember.deleteMany({ where: { userId, roomId } })
  const memberCount = await prisma.roomMember.count({ where: { roomId } })
  return { joined: false, memberCount }
}
