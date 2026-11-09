import { prisma } from "@/libs/prisma"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { getPagination } from "@/libs/http"
import { ECHO_SELECT, decorateEchoes, canViewRoom } from "@/services/echoView"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

export async function GET(req, context) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(req)
    const { page, limit, skip, searchParams } = getPagination(req, { defaultLimit: 10, maxLimit: 30 })
    const sort = (searchParams.get("sort") || "latest").toLowerCase()

    let orderBy = [{ createdAt: "desc" }]
    if (sort === "discussed") {
      orderBy = [{ comments: { _count: "desc" } }, { createdAt: "desc" }]
    } else if (sort === "saved") {
      orderBy = [{ saves: { _count: "desc" } }, { createdAt: "desc" }]
    }

    const room = await prisma.room.findUnique({
      where: { id },
      select: { id: true, isPublic: true, createdById: true },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (!(await canViewRoom(user?.id, room))) {
      return NextResponse.json(
        { error: "This private room is only visible to members." },
        { status: 403 }
      )
    }

    const rows = await prisma.echo.findMany({
      where: { roomId: id },
      orderBy,
      skip,
      take: limit + 1,
      select: ECHO_SELECT,
    })

    const hasMore = rows.length > limit
    const echoes = await decorateEchoes(rows.slice(0, limit), user?.id)

    return NextResponse.json({ page, limit, hasMore, echoes })
  } catch (error) {
    return errorResponse(error)
  }
}
