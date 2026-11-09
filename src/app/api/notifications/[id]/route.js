import { markNotificationRead } from "@/services/notificationService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

export async function PATCH(req, context) {
  try {

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await context.params

    const result = await markNotificationRead(id, user.id)

    return NextResponse.json(result)

  } catch (error) {
    return errorResponse(error)
  }
}