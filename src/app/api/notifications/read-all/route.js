import { markAllNotificationsRead } from "@/services/notificationService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { NextResponse } from "next/server"
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

    const result = await markAllNotificationsRead(user.id)

    return NextResponse.json(result)

  } catch (error) {
    return errorResponse(error)
  }
}