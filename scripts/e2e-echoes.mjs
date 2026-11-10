// End-to-end check of anonymity, editing, threaded replies, @mention suggestions
// and room rules against a RUNNING server (same setup as e2e-rooms.mjs).
//
//   npm run build && npm start
//   node scripts/e2e-echoes.mjs
//
// Creates throw-away users (alice, bob, carol; password "password123") and rooms.
// Development database only. Restart the server between runs (in-memory rate limits).
import "dotenv/config"
import bcrypt from "bcryptjs"
import pg from "pg"

const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
await db.connect()
const hash = await bcrypt.hash("password123", 10)
for (const u of ["alice", "bob", "carol"]) {
  await db.query(
    `INSERT INTO "User"(id,"fullName",username,email,"passwordHash","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW()) ON CONFLICT DO NOTHING`,
    ["u_" + u, u[0].toUpperCase() + u.slice(1) + " Test", u, u + "@t.local", hash]
  )
}
const B = process.env.BASE_URL || "http://localhost:3000"
let pass = 0, fail = 0
const jars = {}
async function login(name) {
  const r = await fetch(B + "/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: name, password: "password123" }) })
  jars[name] = r.headers.getSetCookie().find((x) => x.startsWith("token=")).split(";")[0]
  if (r.status !== 200) throw new Error("login failed " + name)
}
async function call(as, method, path, body) {
  const r = await fetch(B + path, { method, headers: { "content-type": "application/json", ...(as ? { cookie: jars[as] } : {}) }, body: body ? JSON.stringify(body) : undefined })
  let data = null; try { data = await r.json() } catch {}
  return { s: r.status, d: data }
}
function t(name, cond, extra) { if (cond) { pass++; console.log("  ok  ", name) } else { fail++; console.log("  FAIL", name, extra ? JSON.stringify(extra) : "") } }
let r
for (const n of ["alice", "bob", "carol"]) await login(n)
const tag = Date.now() % 100000

console.log("# Space: anonymous by default, identity optional")
r = await call("alice", "POST", "/api/echoes", { content: "space default " + tag })
const spaceAnon = r.d.echo
t("space echo anonymous by default", r.s === 201 && spaceAnon.isAnonymous && spaceAnon.author === null && spaceAnon.isMine, r)
r = await call("alice", "POST", "/api/echoes", { content: "space named " + tag, anonymous: false })
const spaceNamed = r.d.echo
t("space echo can show identity", r.s === 201 && !spaceNamed.isAnonymous && spaceNamed.author?.username === "alice", r)
r = await call("bob", "GET", `/api/echoes/${spaceAnon.id}`)
t("other users never see the anonymous author", r.d.echo.author === null && !r.d.echo.isMine, r)
r = await call("bob", "GET", `/api/echoes/${spaceNamed.id}`)
t("other users see the named author", r.d.echo.author?.username === "alice", r)
r = await call(null, "GET", "/api/users/alice")
const shown = r.d.user.echoes.map((e) => e.content)
t("profile lists the named Space echo", shown.includes("space named " + tag), shown)
t("profile hides the anonymous Space echo", !shown.includes("space default " + tag), shown)

console.log("# Rooms: named by default, anonymous optional, admins can forbid it")
r = await call("alice", "POST", "/api/rooms", { name: "Anon Room " + tag, description: "t", rules: "1. Be kind.\n2. No spam.", isPublic: true })
const room = r.d.room
t("room created with rules", r.s === 201 && room.rules === "1. Be kind.\n2. No spam." && room.allowAnonymous === true, r)
await call("bob", "POST", `/api/rooms/${room.id}/join`)
r = await call("bob", "POST", "/api/echoes", { content: "room default " + tag, roomId: room.id })
t("room echo shows author by default", r.s === 201 && !r.d.echo.isAnonymous && r.d.echo.author?.username === "bob", r)
r = await call("bob", "POST", "/api/echoes", { content: "room anon " + tag, roomId: room.id, anonymous: true })
const roomAnon = r.d.echo
t("room echo can be anonymous", r.s === 201 && roomAnon.isAnonymous && roomAnon.author === null && roomAnon.isMine, r)
r = await call("alice", "GET", `/api/rooms/${room.id}/echoes`)
const seen = r.d.echoes.find((e) => e.id === roomAnon.id)
t("room admin cannot see who wrote an anonymous echo", seen && seen.author === null && !seen.isMine && seen.canModerate, seen)
r = await call(null, "GET", "/api/users/bob")
t("profile hides anonymous room echoes", !r.d.user.echoes.some((e) => e.id === roomAnon.id), r.d.user?.echoes)
r = await call("bob", "PATCH", `/api/rooms/${room.id}`, { rules: "x" })
t("plain member cannot edit rules", r.s === 403, r)
r = await call("alice", "PATCH", `/api/rooms/${room.id}`, { rules: "1. Only kind words.", allowAnonymous: false })
t("admin updates rules and turns anonymity off", r.s === 200 && r.d.room.rules === "1. Only kind words." && r.d.room.allowAnonymous === false, r)
r = await call("bob", "POST", "/api/echoes", { content: "room anon blocked " + tag, roomId: room.id, anonymous: true })
t("anonymous echo refused when the room forbids it", r.s === 400, r)
r = await call("alice", "PATCH", `/api/rooms/${room.id}`, { rules: "y".repeat(1001) })
t("rules longer than 1000 characters refused", r.s === 400, r)
r = await call("alice", "GET", `/api/rooms/${room.id}`)
t("room returns its rules", r.d.room.rules === "1. Only kind words.", r)

console.log("# Editing echoes")
r = await call("alice", "PATCH", `/api/echoes/${spaceAnon.id}`, { title: "T", content: "space default edited " + tag })
t("author edits own echo", r.s === 200 && r.d.echo.content.endsWith("edited " + tag) && r.d.echo.title === "T" && r.d.echo.editedAt, r)
t("editing keeps the echo anonymous", r.d.echo.isAnonymous && r.d.echo.author === null, r)
r = await call("bob", "PATCH", `/api/echoes/${spaceAnon.id}`, { content: "hijack" })
t("someone else cannot edit it", r.s === 403, r)
r = await call("alice", "PATCH", `/api/echoes/${spaceAnon.id}`, { content: "   " })
t("empty content refused", r.s === 400, r)

console.log("# Threaded and anonymous replies")
r = await call("bob", "POST", "/api/comments", { echoId: spaceAnon.id, content: "first reply" })
const c1 = r.d.comment
t("reply on an anonymous echo is anonymous by default", r.s === 201 && c1.isAnonymous && c1.author === null && c1.isMine, r)
r = await call("carol", "POST", "/api/comments", { echoId: spaceAnon.id, content: "named reply", anonymous: false })
const c2 = r.d.comment
t("reply can show identity", r.s === 201 && c2.author?.username === "carol" && !c2.isAnonymous, r)
r = await call("carol", "POST", "/api/comments", { echoId: spaceAnon.id, content: "reply to a reply", parentId: c1.id })
const c3 = r.d.comment
t("reply to a reply is stored under its parent", r.s === 201 && c3.parentId === c1.id, r)
r = await call("alice", "POST", "/api/comments", { echoId: spaceAnon.id, content: "op answers", parentId: c3.id, anonymous: false })
const c4 = r.d.comment
t("original poster of an anonymous echo stays hidden", r.s === 201 && c4.isAnonymous && c4.author === null && c4.isOP, r)
r = await call("bob", "POST", "/api/comments", { echoId: spaceNamed.id, content: "wrong thread", parentId: c1.id })
t("cannot reply to a reply from another echo", r.s === 404, r)
r = await call("carol", "GET", `/api/comments/echo/${spaceAnon.id}`)
t("thread comes back with parent ids", r.d.comments.length === 4 && r.d.comments.find((c) => c.id === c3.id).parentId === c1.id, r.d.comments)
const { rows: notes } = await db.query(`SELECT message FROM "Notification" WHERE "userId" = 'u_bob' ORDER BY "createdAt" DESC LIMIT 5`)
t("parent author is notified without a name for anonymous replies", notes.some((n) => n.message === "Someone replied to your comment"), notes)

console.log("# Editing replies")
r = await call("bob", "PATCH", `/api/comments/${c1.id}`, { content: "first reply edited" })
t("author edits own reply", r.s === 200 && r.d.comment.content === "first reply edited" && r.d.comment.editedAt && r.d.comment.isAnonymous, r)
r = await call("carol", "PATCH", `/api/comments/${c1.id}`, { content: "hijack" })
t("someone else cannot edit it", r.s === 403, r)

console.log("# Room anonymity applies to replies too")
r = await call("bob", "POST", "/api/echoes", { content: "room echo for replies " + tag, roomId: room.id })
const re = r.d.echo
r = await call("bob", "POST", "/api/comments", { echoId: re.id, content: "anon reply", anonymous: true })
t("anonymous reply refused when the room forbids it", r.s === 400, r)
r = await call("bob", "POST", "/api/comments", { echoId: re.id, content: "named reply" })
t("named reply works", r.s === 201 && r.d.comment.author?.username === "bob", r)

console.log("# Deleting a reply removes its thread")
r = await call("bob", "DELETE", `/api/comments/${c1.id}`)
t("deleting a reply removes the replies under it", r.s === 200 && r.d.removed === 3, r)
r = await call("carol", "GET", `/api/comments/echo/${spaceAnon.id}`)
t("only the unrelated reply remains", r.d.comments.length === 1 && r.d.comments[0].id === c2.id, r.d.comments)

console.log("# @mention suggestions")
r = await call("bob", "GET", "/api/search/mentions?q=ali")
t("suggests users by username prefix", r.s === 200 && r.d.users.some((u) => u.username === "alice") && !("email" in (r.d.users[0] || {})), r)
r = await call("bob", "GET", "/api/search/mentions?q=a")
t("works from one character", r.s === 200 && r.d.users.length > 0, r)
r = await call("bob", "GET", "/api/search/mentions?q=%25%27")
t("odd input returns an empty list", r.s === 200 && r.d.users.length === 0, r)
r = await call(null, "GET", "/api/search/mentions?q=ali")
t("requires login", r.s === 401, r)
r = await call("bob", "POST", "/api/echoes", { content: "hello @carol " + tag })
const before = (await db.query(`SELECT COUNT(*)::int AS n FROM "Notification" WHERE "userId" = 'u_carol' AND message LIKE '%mentioned you%'`)).rows[0].n
await call("bob", "PATCH", `/api/echoes/${r.d.echo.id}`, { content: "hello @carol, edited " + tag })
const after = (await db.query(`SELECT COUNT(*)::int AS n FROM "Notification" WHERE "userId" = 'u_carol' AND message LIKE '%mentioned you%'`)).rows[0].n
t("editing does not notify the same person twice", before === 1 && after === 1, { before, after })
await call("bob", "PATCH", `/api/echoes/${r.d.echo.id}`, { content: "hello @carol and @alice, edited " + tag })
const alice = (await db.query(`SELECT COUNT(*)::int AS n FROM "Notification" WHERE "userId" = 'u_alice' AND message LIKE '%mentioned you%'`)).rows[0].n
t("newly added mention is notified", alice >= 1, { alice })

console.log(`\n${pass} passed, ${fail} failed`)
await db.end()
process.exit(fail ? 1 : 0)
