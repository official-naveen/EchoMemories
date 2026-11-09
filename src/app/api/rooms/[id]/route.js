import { getRoomById, updateRoom, deleteRoom } from "@/services/roomService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"
import { route, readBody } from "@/libs/route"

export async function GET(req, context) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(req)

    const room = await getRoomById(user?.id, id)

    return NextResponse.json({ room })
  } catch (error) {
    return errorResponse(error)
  }
}

// Admin: rename / change description. Owner: also public <-> private.
export const PATCH = route(async ({ req, user, params }) => ({
  room: await updateRoom(user.id, params.id, await readBody(req)),
}))

// Owner only: deletes the room and everything in it.
export const DELETE = route(async ({ user, params }) => deleteRoom(user.id, params.id))
