import { prisma } from "@/libs/prisma"
import { dayDiff } from "@/libs/dates"

// Called whenever a user does something meaningful (post, comment, ping...).
// Keeps lastActiveDate fresh and maintains the daily streak.
export async function updateUserActivity(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActiveDate: true, streakDays: true },
  })
  if (!user) return { status: "no-user", streakDays: 0 }

  const now = new Date()
  let streakDays = user.streakDays
  let status = "same-day"

  if (!user.lastActiveDate) {
    streakDays = 1
    status = "started"
  } else {
    const diff = dayDiff(now, user.lastActiveDate)
    if (diff === 1) {
      streakDays = user.streakDays + 1
      status = "increased"
    } else if (diff > 1) {
      streakDays = 1
      status = "restarted"
    } else if (user.streakDays === 0) {
      streakDays = 1
      status = "started"
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveDate: now, streakDays },
  })

  if (status !== "same-day") {
    await prisma.userLog.create({ data: { userId, action: `streak_${status}` } })
  }

  return { status, streakDays }
}
