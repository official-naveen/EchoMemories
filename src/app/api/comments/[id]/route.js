import { updateComment, deleteComment } from "@/services/commentService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

export async function PATCH(req, context) {
  try {

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()

    const comment = await updateComment(user.id, id, body)

    return NextResponse.json({ comment })

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

    const result = await deleteComment(user.id, id)

    return NextResponse.json(result)

  } catch (error) {
    return errorResponse(error)
  }
}