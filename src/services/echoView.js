import { prisma } from "@/libs/prisma"
import { httpError } from "@/libs/http"

// Shape every echo list/detail query uses.
export const ECHO_SELECT = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  isInSpace: true,
  isAnonymous: true,
  editedAt: true,
  authorId: true,
  author: {
    select: { id: true, username: true, fullName: true, avatar: true, pulseScore: true },
  },
  room: { select: { id: true, name: true, isPublic: true, allowAnonymous: true } },
  _count: { select: { comments: true, resonations: true, saves: true } },
}

// Public-facing echo object.
// - Anonymous echoes (the default in Space, optional in rooms) hide the author;
//   only `isMine` tells the owner.
// - viewer state (resonated / saved) is attached when a user is known.
export async function decorateEchoes(rows, viewerId) {
  let resonated = new Set()
  let saved = new Set()
  let adminRooms = new Set() // rooms where the viewer is an admin (may moderate)

  if (viewerId && rows.length) {
    const ids = rows.map((r) => r.id)
    const roomIds = [...new Set(rows.map((x) => x.room?.id).filter(Boolean))]
    const [r, s, admins] = await Promise.all([
      prisma.resonation.findMany({ where: { userId: viewerId, echoId: { in: ids } }, select: { echoId: true } }),
      prisma.save.findMany({ where: { userId: viewerId, echoId: { in: ids } }, select: { echoId: true } }),
      roomIds.length
        ? prisma.roomMember.findMany({ where: { userId: viewerId, role: "ADMIN", roomId: { in: roomIds } }, select: { roomId: true } })
        : [],
    ])
    adminRooms = new Set(admins.map((x) => x.roomId))
    resonated = new Set(r.map((x) => x.echoId))
    saved = new Set(s.map((x) => x.echoId))
  }

  return rows.map((e) => ({
    id: e.id,
    title: e.title,
    content: e.content,
    createdAt: e.createdAt,
    isInSpace: e.isInSpace,
    isAnonymous: e.isAnonymous,
    editedAt: e.editedAt,
    isMine: !!viewerId && e.authorId === viewerId,
    canModerate: !!e.room && adminRooms.has(e.room.id), // room admins may delete echoes/replies here
    author: e.isAnonymous ? null : e.author,
    room: e.room ? { id: e.room.id, name: e.room.name, allowAnonymous: e.room.allowAnonymous } : null,
    counts: e._count,
    viewer: { resonated: resonated.has(e.id), saved: saved.has(e.id) },
  }))
}

export async function canViewRoom(userId, room) {
  if (room.isPublic) return true
  if (!userId) return false
  if (room.createdById === userId) return true
  const m = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId: room.id } },
    select: { id: true },
  })
  return !!m
}

// Loads an echo and throws 404 / 403 if the viewer may not see it.
export async function loadViewableEcho(echoId, viewerId, select = ECHO_SELECT) {
  if (!echoId || typeof echoId !== "string") throw httpError(400, "echoId required")

  const echo = await prisma.echo.findUnique({
    where: { id: echoId },
    select: { ...select, room: { select: { id: true, name: true, isPublic: true, createdById: true, allowAnonymous: true } } },
  })
  if (!echo) throw httpError(404, "Echo not found")

  if (echo.room && !(await canViewRoom(viewerId, echo.room))) {
    throw httpError(403, "This echo is in a private room")
  }
  return echo
}
