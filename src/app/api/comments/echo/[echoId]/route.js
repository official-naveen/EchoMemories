import { NextResponse } from "next/server"
import { listComments } from "@/services/commentService"
import { getUserFromRequest } from "@/libs/getUserFromRequest"

export async function GET(req, context) {
  try {
    const { echoId } = await context.params
    const user = await getUserFromRequest(req)
    return NextResponse.json(await listComments(req, echoId, user?.id))
  } catch (error) {
    if (!error.status) console.error("ECHO COMMENTS ERROR:", error)
    return NextResponse.json(
      { error: error.status ? error.message : "Server error" },
      { status: error.status || 500 }
    )
  }
}
