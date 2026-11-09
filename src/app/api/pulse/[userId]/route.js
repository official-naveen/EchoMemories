import { getUserPulse } from "@/services/pulseService"
import { NextResponse } from "next/server"
import { errorResponse } from "@/libs/http"

export async function GET(req, context) {
  try {

    const { userId } = await context.params

    const pulse = await getUserPulse(userId)

    return NextResponse.json(pulse)

  } catch (error) {
    return errorResponse(error)
  }
}