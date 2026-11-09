import { joinRoom, leaveRoom } from "@/services/roomService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

async function handle(req, context, action) {
  try {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const result = await action(user.id, id)

    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}

export const POST = (req, ctx) => handle(req, ctx, joinRoom)
export const DELETE = (req, ctx) => handle(req, ctx, leaveRoom)
