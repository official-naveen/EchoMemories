import { getSpaceFeed } from "@/services/feedService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

export async function GET(req) {
  try {

    const user = await getUserFromRequest(req)

    const result = await getSpaceFeed(req, user?.id)

    return NextResponse.json(result)

  } catch (error) {
    return errorResponse(error)
  }
}