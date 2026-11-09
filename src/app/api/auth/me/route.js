import { NextResponse } from "next/server"
import { getUserFromRequest } from "@/libs/getUserFromRequest"

// The current user, with what the app shell needs: profile basics and rooms.
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req, {
      bio: true,
      country: true,
      roomMemberships: {
        orderBy: { joinedAt: "desc" },
        select: { room: { select: { id: true, name: true, description: true } } },
      },
    })

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ user })
  } catch (error) {
    console.error("AUTH ME ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
