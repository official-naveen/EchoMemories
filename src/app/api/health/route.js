import { NextResponse } from "next/server"
import { prisma } from "@/libs/prisma"

export const dynamic = "force-dynamic"

// For uptime monitors and load balancers. Reveals nothing but up/down.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: "ok" })
  } catch {
    return NextResponse.json({ status: "down" }, { status: 503 })
  }
}
