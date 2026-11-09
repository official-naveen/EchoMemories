import { toggleSave } from "@/services/engagementService"
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

    const { echoId } = await req.json()

    const result = await toggleSave(user.id, echoId)

    return NextResponse.json(result)

  } catch (error) {
    return errorResponse(error)
  }
}