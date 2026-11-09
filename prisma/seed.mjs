// Seeds starter rooms (signup requires picking 5), a few sample writers and a
// first batch of echoes, replies and reactions. Safe to run many times: anything
// that already exists is skipped.   Usage:  npm run db:seed
import "dotenv/config"
import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import pg from "pg"
import { ROOMS, WRITERS, ECHOES } from "./seed-data.mjs"

const cuid = () => "c" + crypto.randomBytes(12).toString("hex")
const HOUR = 3600_000

// Small deterministic generator so every run produces the same reactions.
function lcg(seed) {
  let s = seed
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const one = async (text, params) => (await client.query(text, params)).rows[0]

try {
  // Random password: nobody can log in as a seeded account.
  const lockedHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10)

  async function ensureUser({ username, fullName, email, bio, pulseScore = 1, streakDays = 0 }) {
    const found = await one('SELECT id FROM "User" WHERE email = $1', [email])
    if (found) return { id: found.id, created: false }
    const id = cuid()
    await client.query(
      `INSERT INTO "User" (id, "fullName", username, email, "passwordHash", bio, country, "pulseScore", "streakDays", "lastActiveDate", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,'India',$7,$8,NOW(),NOW())`,
      [id, fullName, username, email, lockedHash, bio, pulseScore, streakDays]
    )
    return { id, created: true }
  }

  // --- the team account that owns the starter rooms ---
  const team = await ensureUser({
    username: "echo",
    fullName: "Echo Team",
    email: "echo@echomemories.local",
    bio: "The keepers of the starter rooms.",
  })

  // --- rooms ---
  const roomIds = new Map()
  let roomsCreated = 0
  for (const [name, description] of ROOMS) {
    const existing = await one('SELECT id FROM "Room" WHERE name = $1 AND "isPublic" = true', [name])
    if (existing) {
      roomIds.set(name, existing.id)
      continue
    }
    const id = cuid()
    await client.query(
      'INSERT INTO "Room" (id, name, description, "isPublic", "createdById") VALUES ($1,$2,$3,true,$4)',
      [id, name, description, team.id]
    )
    await client.query(`INSERT INTO "RoomMember" (id, "userId", "roomId", role) VALUES ($1,$2,$3,'ADMIN')`, [cuid(), team.id, id])
    roomIds.set(name, id)
    roomsCreated++
  }

  // --- sample writers, joined to every room they post in plus a few others ---
  const joinRand = lcg(7)
  const writers = new Map()
  let writersCreated = 0
  const roomNames = ROOMS.map(([name]) => name)
  for (const [username, fullName, bio, pulseScore, streakDays] of WRITERS) {
    const user = await ensureUser({ username, fullName, email: `${username}@echomemories.local`, bio, pulseScore, streakDays })
    if (user.created) writersCreated++
    writers.set(username, user.id)

    const postedIn = ECHOES.filter((e) => e.by === username && e.room).map((e) => e.room)
    const extra = Array.from({ length: 3 }, () => roomNames[Math.floor(joinRand() * roomNames.length)])
    for (const name of new Set([...postedIn, ...extra])) {
      await client.query(
        'INSERT INTO "RoomMember" (id, "userId", "roomId") VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [cuid(), user.id, roomIds.get(name)]
      )
    }
  }

  // --- echoes, replies, resonations, saves ---
  const rand = lcg(42)
  const writerIds = [...writers.values()]
  const now = Date.now()
  let echoesCreated = 0

  // Mix rooms and Space so the home feed doesn't read room by room.
  const order = [...ECHOES]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }

  for (const [i, echo] of order.entries()) {
    const authorId = writers.get(echo.by)
    const existing = await one('SELECT id FROM "Echo" WHERE "authorId" = $1 AND content = $2', [authorId, echo.text])
    if (existing) continue

    // Spread posts over the last three weeks, oldest first.
    const createdAt = new Date(now - ((order.length - i) / order.length) * 21 * 24 * HOUR + rand() * 6 * HOUR)
    const echoId = cuid()
    await client.query(
      'INSERT INTO "Echo" (id, title, content, "authorId", "roomId", "isInSpace", "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [echoId, echo.title ?? null, echo.text, authorId, echo.room ? roomIds.get(echo.room) : null, !echo.room, createdAt]
    )
    echoesCreated++

    for (const [replyBy, text] of echo.replies) {
      const at = new Date(Math.min(now, createdAt.getTime() + (20 + rand() * 400) * 60_000))
      await client.query('INSERT INTO "Comment" (id, content, "authorId", "echoId", "createdAt") VALUES ($1,$2,$3,$4,$5)', [
        cuid(), text, writers.get(replyBy), echoId, at,
      ])
    }

    const others = writerIds.filter((id) => id !== authorId).sort(() => rand() - 0.5)
    const resonators = others.slice(0, 2 + Math.floor(rand() * 6))
    const savers = others.slice(0, Math.floor(rand() * 4))
    for (const userId of resonators) {
      await client.query('INSERT INTO "Resonation" (id, "userId", "echoId") VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [cuid(), userId, echoId])
    }
    for (const userId of savers) {
      await client.query('INSERT INTO "Save" (id, "userId", "echoId") VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [cuid(), userId, echoId])
    }
  }

  // --- the welcome echo in Space ---
  const hasWelcome = await one('SELECT id FROM "Echo" WHERE "authorId" = $1 LIMIT 1', [team.id])
  if (!hasWelcome) {
    await client.query(
      `INSERT INTO "Echo" (id, title, content, "authorId", "isInSpace")
       VALUES ($1, 'Welcome to Space', 'This is Space - a quiet layer of anonymous echoes. Say something true and let it travel.', $2, true)`,
      [cuid(), team.id]
    )
  }

  console.log(`Seed complete: ${roomsCreated} room(s), ${writersCreated} sample writer(s), ${echoesCreated} echo(es) added.`)
} finally {
  await client.end()
}
