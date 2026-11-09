import { getSavedEchoes } from "@/services/engagementService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(await getSavedEchoes(req, user.id))
  } catch (error) {
    return errorResponse(error)
  }
}
