import { getPulseLeaderboard } from "@/services/pulseService"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

export async function GET(req) {
  try {

    const result = await getPulseLeaderboard(req)

    return NextResponse.json(result)

  } catch (error) {
    return errorResponse(error)
  }
}