import { NextResponse } from "next/server"
import { clearCookie } from "@/libs/cookies"

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" })
  response.cookies.set(clearCookie("token"))
  return response
}
