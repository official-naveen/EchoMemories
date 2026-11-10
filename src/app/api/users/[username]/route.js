import { prisma } from "@/libs/prisma"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

// Public profile. Only shows echoes from public rooms - Space echoes are
// anonymous and private-room echoes stay inside their room.
export async function GET(req, context) {
  try {
    const { username } = await context.params
    const viewer = await getUserFromRequest(req)

    const user = await prisma.user.findUnique({
      where: { username: String(username).toLowerCase() },
      select: {
        id: true,
        fullName: true,
        nickname: true,
        username: true,
        avatar: true,
        bio: true,
        country: true,
        pulseScore: true,
        streakDays: true,
        createdAt: true,
        _count: { select: { echoes: { where: { isAnonymous: false, OR: [{ room: { isPublic: true } }, { isInSpace: true }] } }, roomMemberships: { where: { room: { isPublic: true } } } } },
        echoes: {
          where: { isAnonymous: false, OR: [{ room: { isPublic: true } }, { isInSpace: true }] },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            room: { select: { id: true, name: true } },
            _count: { select: { comments: true, resonations: true, saves: true } },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const higher = await prisma.user.count({ where: { pulseScore: { gt: user.pulseScore } } })

    return NextResponse.json({
      user: { ...user, rank: higher + 1, isMe: viewer?.id === user.id },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
