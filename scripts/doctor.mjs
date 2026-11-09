// Friendly preflight check run before `npm run dev`.
// Catches the usual first-run problems and tells you exactly how to fix them.
import fs from "node:fs"
import crypto from "node:crypto"
import path from "node:path"
import dotenv from "dotenv"
import pg from "pg"

const checkDb = !process.argv.includes("--no-db")
const red = (s) => `\x1b[31m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
let failed = false
const fail = (msg) => { failed = true; console.error(red("✖ ") + msg) }

// 1. Node version (Prisma 7 needs 20.19+)
const [maj, min] = process.versions.node.split(".").map(Number)
if (maj < 20 || (maj === 20 && min < 19)) {
  fail(`Node ${process.versions.node} is too old. Install Node 20.19+ or 22 (https://nodejs.org).`)
}

// 2. .env file (created automatically from .env.example if missing)
const envPath = path.resolve(".env")
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(".env.example")) {
    let txt = fs.readFileSync(".env.example", "utf8")
    txt = txt
      .replace('JWT_SECRET="change-me"', `JWT_SECRET="${crypto.randomBytes(48).toString("hex")}"`)
      .replace('CRON_SECRET="change-me-too"', `CRON_SECRET="${crypto.randomBytes(24).toString("hex")}"`)
    fs.writeFileSync(envPath, txt)
    console.log(yellow("! .env did not exist, so I created it from .env.example with fresh secrets."))
  }
}
dotenv.config({ quiet: true })

// 3. Required variables
if (!process.env.DATABASE_URL) {
  fail("DATABASE_URL is missing in .env (example: postgresql://postgres:password@localhost:5432/echomemories).")
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-me") {
  console.log(yellow("! JWT_SECRET is not set to a real secret. Fine for local testing, required in production."))
}
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log(yellow("! No EMAIL_USER / EMAIL_PASS: OTP codes will be printed in this terminal instead of emailed."))
}

// 4. Database reachable + migrated + seeded
if (!failed && checkDb) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()
    const t = await client.query(`SELECT to_regclass('public."User"') AS u, to_regclass('public."Notification"') AS n`)
    if (!t.rows[0].u) {
      fail('The database has no tables yet. Run:  npx prisma migrate deploy   (then: npm run db:seed)')
    } else {
      const col = await client.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name='Notification' AND column_name='link'
         AND to_regclass('public."RoomInvite"') IS NOT NULL`
      )
      if (!col.rowCount) fail("The database is missing the latest migration. Run:  npx prisma migrate deploy")
      const rooms = await client.query('SELECT COUNT(*)::int AS c FROM "Room" WHERE "isPublic" = true')
      if (rooms.rows[0].c < 5) {
        console.log(yellow("! Fewer than 5 public rooms exist, so signup cannot finish. Run:  npm run db:seed"))
      }
    }
  } catch (e) {
    fail(`Cannot connect to PostgreSQL: ${e.message}\n  Check that PostgreSQL is running and DATABASE_URL in .env is correct.`)
  } finally {
    await client.end().catch(() => {})
  }
}

if (failed) {
  console.error(red("\nFix the problem(s) above and run the command again."))
  process.exit(1)
}
console.log(green("✔ Environment looks good."))
