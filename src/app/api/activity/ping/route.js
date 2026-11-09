import { getUserFromRequest } from "@/libs/getUserFromRequest"
import { updateUserActivity } from "@/libs/activity"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

const MESSAGES = {
  started: "Streak started",
  increased: "Streak increased",
  restarted: "Streak restarted",
  "same-day": "Already active today",
}

// The frontend calls this when the app opens to keep the streak alive.
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { status, streakDays } = await updateUserActivity(user.id)

    return NextResponse.json({ message: MESSAGES[status] || "OK", streakDays })
  } catch (error) {
    return errorResponse(error)
  }
}
