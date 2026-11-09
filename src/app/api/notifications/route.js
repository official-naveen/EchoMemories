import { getNotifications } from "@/services/notificationService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

export async function GET(req) {
  try {

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const result = await getNotifications(req, user.id)

    return NextResponse.json(result)

  } catch (error) {
    return errorResponse(error)
  }
}