import { createEcho } from "@/services/echoService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { updateUserActivity } from "@/libs/activity"
import { NextResponse } from "next/server"
import { rateLimit, tooManyRequests } from "@/libs/rateLimit"
import { errorResponse } from "@/libs/http"

export async function POST(req) {
  try {

    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const limit = rateLimit(`echoes:${user.id}`, 5, 60 * 60 * 1000)
    if (limit.limited) return tooManyRequests(limit, "Rate limit exceeded. You can post up to 5 echoes per hour.")

    const body = await req.json()

    const echo = await createEcho(user.id, body)
    await updateUserActivity(user.id)

    return NextResponse.json({ echo }, { status: 201 })

  } catch (error) {
    return errorResponse(error)
  }
}
