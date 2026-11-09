import { NextResponse } from "next/server"
import { checkBrokenStreaks } from "@/services/pulseService"
import { isAuthorizedCron } from "@/libs/cron"

// Daily job: reset broken streaks and apply a 2% Pulse decay to those users.
// POST for manual calls, GET because Vercel Cron sends GET.
export async function POST(req) {
  try {
    if (!isAuthorizedCron(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json(await checkBrokenStreaks())
  } catch (error) {
    console.error("PULSE STREAK ERROR:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export const GET = POST
