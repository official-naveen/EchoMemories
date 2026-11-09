import { recalculateDailyPulse } from "@/services/pulseService"
import { isAuthorizedCron } from "@/libs/cron"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

// Daily job: recompute Pulse scores. POST for manual calls, GET because Vercel Cron sends GET.
export async function POST(req) {
  try {
    if (!isAuthorizedCron(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await recalculateDailyPulse()

    return NextResponse.json(result)

  } catch (error) {
    return errorResponse(error)
  }
}

export const GET = POST
