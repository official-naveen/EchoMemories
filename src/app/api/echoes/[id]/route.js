import { getEchoById, updateEcho, deleteEcho } from "@/services/echoService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

export async function GET(req, context) {
  try {

    const { id } = await context.params
    const user = await getUserFromRequest(req)

    const echo = await getEchoById(id, user?.id)

    return NextResponse.json({ echo })

  } catch (error) {
    return errorResponse(error)
  }
}



export async function PATCH(req, context) {
  try {

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()

    const echo = await updateEcho(user.id, id, body)

    return NextResponse.json({ echo })

  } catch (error) {
    return errorResponse(error)
  }
}



export async function DELETE(req, context) {
  try {

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const result = await deleteEcho(user.id, id)

    return NextResponse.json(result)

  } catch (error) {
    return errorResponse(error)
  }
}