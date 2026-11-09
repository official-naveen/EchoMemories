import { prisma } from "@/libs/prisma"
import { httpError, getPagination } from "@/libs/http"
import { dayKey, dayStart } from "@/libs/dates"

// How much each kind of activity is worth in the daily recalculation.
export const PULSE_WEIGHTS = {
  base: 1,
  echo: 1,
  comment: 0.5,
  resonationReceived: 0.3,
  mentionReceived: 0.4,
  streakDay: 0.1,
}
const WINDOW_DAYS = 30

// Small instant reward so users see Pulse move right away.
// The daily recalculation is the source of truth and will overwrite it.
export async function bumpPulse(userId, amount) {
  try {
    await prisma.$executeRaw`
      UPDATE "User"
      SET "pulseScore" = ROUND(("pulseScore" + ${amount})::numeric, 2)
      WHERE "id" = ${userId}`
  } catch {
    /* user may be gone - ignore */
  }
}

export async function getUserPulse(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      pulseScore: true,
      streakDays: true,
      lastActiveDate: true,
    },
  })
  if (!user) throw httpError(404, "User not found")

  const higher = await prisma.user.count({ where: { pulseScore: { gt: user.pulseScore } } })
  return { ...user, rank: higher + 1 }
}

export async function getPulseLeaderboard(req) {
  const { page, limit, skip } = getPagination(req, { defaultLimit: 20, maxLimit: 100 })

  const users = await prisma.user.findMany({
    orderBy: [{ pulseScore: "desc" }, { createdAt: "asc" }],
    skip,
    take: limit,
    select: {
      id: true,
      username: true,
      fullName: true,
      avatar: true,
      pulseScore: true,
      streakDays: true,
    },
  })

  return {
    page,
    limit,
    users: users.map((u, i) => ({ ...u, rank: skip + i + 1 })),
  }
}

export async function recalculateDailyPulse() {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const [echoes, comments, mentions, resonations, users] = await Promise.all([
    prisma.echo.groupBy({ by: ["authorId"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.comment.groupBy({ by: ["authorId"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.mention.groupBy({ by: ["mentionedUserId"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.$queryRaw`
      SELECT e."authorId" AS "userId", COUNT(*)::int AS "count"
      FROM "Resonation" r JOIN "Echo" e ON e."id" = r."echoId"
      WHERE r."createdAt" >= ${since}
      GROUP BY e."authorId"`,
    prisma.user.findMany({ select: { id: true, pulseScore: true, streakDays: true } }),
  ])

  const toMap = (rows, key, val) => new Map(rows.map((r) => [r[key], Number(val(r))]))
  const echoMap = toMap(echoes, "authorId", (r) => r._count._all)
  const commentMap = toMap(comments, "authorId", (r) => r._count._all)
  const mentionMap = toMap(mentions, "mentionedUserId", (r) => r._count._all)
  const resonMap = toMap(resonations, "userId", (r) => r.count)

  const W = PULSE_WEIGHTS
  let updated = 0

  for (const u of users) {
    const score =
      W.base +
      W.echo * (echoMap.get(u.id) || 0) +
      W.comment * (commentMap.get(u.id) || 0) +
      W.resonationReceived * (resonMap.get(u.id) || 0) +
      W.mentionReceived * (mentionMap.get(u.id) || 0) +
      W.streakDay * u.streakDays

    const rounded = Math.round(score * 100) / 100
    if (rounded !== u.pulseScore) {
      await prisma.user.update({ where: { id: u.id }, data: { pulseScore: rounded } })
      updated++
    }
  }

  return { message: "Pulse recalculated", users: users.length, updated }
}

// Daily job. Resets the streak of everyone who skipped at least one whole
// calendar day and applies a 2% Pulse decay to them (never below 1).
export async function checkBrokenStreaks() {
  const cutoff = dayStart(dayKey() - 1) // start of "yesterday"

  const reset = await prisma.$executeRaw`
    UPDATE "User"
    SET "streakDays" = 0,
        "pulseScore" = GREATEST(1, ROUND(("pulseScore" * 0.98)::numeric, 2))
    WHERE "streakDays" > 0
      AND "lastActiveDate" IS NOT NULL
      AND "lastActiveDate" < ${cutoff}`

  return { message: "Streak check completed", reset: Number(reset) }
}
