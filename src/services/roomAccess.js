import { prisma } from "@/libs/prisma"
import { httpError } from "@/libs/http"
import { canViewRoom } from "@/services/echoView"

// Everything about "who may do what in a room" lives here so the rules are
// written once:
//
//   owner  = Room.createdBy      -> can do everything, incl. roles/transfer/delete
//   admin  = RoomMember.role ADMIN -> invite, remove members, edit, moderate echoes
//   member = RoomMember.role MEMBER -> read, post, reply
//
// The owner is always treated as an admin, even if their member row is missing.

export const ROOM_BASICS = { id: true, name: true, isPublic: true, createdById: true }

export async function loadRoom(roomId, select = ROOM_BASICS) {
  if (!roomId || typeof roomId !== "string") throw httpError(400, "Room id required")
  const room = await prisma.room.findUnique({ where: { id: roomId }, select })
  if (!room) throw httpError(404, "Room not found")
  return room
}

export async function getMembership(userId, roomId) {
  if (!userId) return null
  return prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId } },
    select: { id: true, role: true, joinedAt: true },
  })
}

// The viewer's standing in a room: { isOwner, isAdmin, isMember, role }.
export async function getRoomRole(userId, room) {
  const isOwner = !!userId && room.createdById === userId
  const membership = await getMembership(userId, room.id)
  const isAdmin = isOwner || membership?.role === "ADMIN"
  return {
    isOwner,
    isAdmin,
    isMember: isOwner || !!membership,
    role: isAdmin ? "ADMIN" : membership ? "MEMBER" : null,
  }
}

export async function isRoomAdmin(userId, room) {
  return (await getRoomRole(userId, room)).isAdmin
}

// Loads the room and throws unless `userId` is an admin (or the owner).
export async function requireAdmin(userId, roomId, select = ROOM_BASICS) {
  const room = await loadRoom(roomId, { ...ROOM_BASICS, ...select })
  const standing = await getRoomRole(userId, room)
  if (!standing.isAdmin) {
    if (!room.isPublic && !standing.isMember) throw httpError(403, "This private room is only visible to members.")
    throw httpError(403, "Only room admins can do this")
  }
  return { room, ...standing }
}

export async function requireOwner(userId, roomId, select = ROOM_BASICS) {
  const room = await loadRoom(roomId, { ...ROOM_BASICS, ...select })
  const standing = await getRoomRole(userId, room)
  if (!standing.isOwner) {
    if (!room.isPublic && !standing.isMember) throw httpError(403, "This private room is only visible to members.")
    throw httpError(403, "Only the room owner can do this")
  }
  return { room, ...standing }
}

// Loads the room and throws unless the viewer may see it (public, or member).
export async function requireViewable(userId, roomId, select = ROOM_BASICS) {
  const room = await loadRoom(roomId, { ...ROOM_BASICS, ...select })
  if (!(await canViewRoom(userId, room))) throw httpError(403, "This private room is only visible to members.")
  return room
}
