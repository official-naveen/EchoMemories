import { createRoom, getRooms } from "@/services/roomService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { NextResponse } from "next/server"
import { rateLimit, tooManyRequests } from "@/libs/rateLimit"
import { errorResponse } from "@/libs/http"

export async function POST(req) {
  try {

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const limit = rateLimit(`rooms:${user.id}`, 3, 60 * 60 * 1000)
    if (limit.limited) return tooManyRequests(limit, "Rate limit exceeded. You can create up to 3 rooms per hour.")

    const body = await req.json()

    const room = await createRoom(user.id, body)

    return NextResponse.json({ room }, { status: 201 })

  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(req) {
  try {

    const user = await getUserFromRequest(req)
    const rooms = await getRooms(req, user?.id)

    return NextResponse.json(rooms)

  } catch (error) {
    return errorResponse(error)
  }
}
