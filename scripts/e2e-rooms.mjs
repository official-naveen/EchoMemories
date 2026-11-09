// End-to-end check of the room features (roles, invites, invite links, members,
// moderation, ownership transfer, privacy) against a RUNNING server.
//
//   npm run build && npm start            (in one terminal)
//   node scripts/e2e-rooms.mjs            (in another; uses DATABASE_URL from .env)
//
// It creates five throw-away users (alice, bob, carol, dave, eve; password
// "password123") and a few rooms. Run it against a development database only.
// Note: the server rate-limits echoes (5/hour/user) and rooms (3/hour/user), so
// restart the server before running it twice in a row.
import "dotenv/config"
import bcrypt from "bcryptjs"
import pg from "pg"

const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
await db.connect()
const hash = await bcrypt.hash("password123", 10)
for (const u of ["alice", "bob", "carol", "dave", "eve"]) {
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
  const c = r.headers.getSetCookie().find((x) => x.startsWith("token="))
  jars[name] = c.split(";")[0]
  if (r.status !== 200) throw new Error("login failed " + name)
}
async function call(as, method, path, body) {
  const r = await fetch(B + path, { method, headers: { "content-type": "application/json", ...(as ? { cookie: jars[as] } : {}) }, body: body ? JSON.stringify(body) : undefined })
  let data = null; try { data = await r.json() } catch {}
  return { s: r.status, d: data }
}
function t(name, cond, extra) { if (cond) { pass++; console.log("  ok  ", name) } else { fail++; console.log("  FAIL", name, extra ? JSON.stringify(extra) : "") } }

for (const n of ["alice","bob","carol","dave","eve"]) await login(n)

console.log("# create private room")
let r = await call("alice", "POST", "/api/rooms", { name: "Secret Club " + Date.now() % 100000, description: "hidden", isPublic: false })
t("create 201", r.s === 201, r)
const room = r.d.room, id = room.id
t("creator is owner+admin", room.isOwner && room.isAdmin && room.myRole === "ADMIN", room)

console.log("# privacy before invite")
r = await call("bob", "GET", `/api/rooms/${id}`); t("bob cannot see room (403)", r.s === 403, r)
r = await call("bob", "GET", `/api/rooms/${id}/members`); t("bob cannot list members (403)", r.s === 403, r)
r = await call("bob", "POST", `/api/rooms/${id}/join`); t("bob cannot self-join private (403)", r.s === 403, r)
r = await call(null, "GET", `/api/rooms/${id}/members`); t("anon cannot list members (401)", r.s === 401, r)

console.log("# members list (owner)")
r = await call("alice", "GET", `/api/rooms/${id}/members`)
t("alice sees 1 member", r.s === 200 && r.d.total === 1 && r.d.members[0].role === "OWNER", r)
t("viewer flags", r.d.viewer.isAdmin && r.d.viewer.isOwner, r.d.viewer)

console.log("# search users")
r = await call("alice", "GET", `/api/search/users?q=bo&roomId=${id}`)
t("search finds bob w/o status", r.s === 200 && r.d.users.some((u) => u.username === "bob" && u.status === null), r)
t("search never returns email", !JSON.stringify(r.d).includes("@t.local"))
r = await call("bob", "GET", `/api/search/users?q=ca&roomId=${id}`); t("non-admin cannot probe room status (403)", r.s === 403, r)
r = await call("bob", "GET", `/api/search/users?q=ca`); t("plain search ok for any user", r.s === 200 && r.d.users.length >= 1, r)
r = await call("alice", "GET", `/api/search/users?q=a`); t("1-char query returns nothing", r.d.users.length === 0)
r = await call(null, "GET", `/api/search/users?q=bob`); t("search needs login (401)", r.s === 401)

console.log("# invites")
r = await call("bob", "POST", `/api/rooms/${id}/invites`, { username: "carol" }); t("non-member cannot invite (403)", r.s === 403, r)
r = await call("alice", "POST", `/api/rooms/${id}/invites`, { username: "nobody_here" }); t("unknown user 404", r.s === 404, r)
r = await call("alice", "POST", `/api/rooms/${id}/invites`, { username: "alice" }); t("self invite 400", r.s === 400, r)
r = await call("alice", "POST", `/api/rooms/${id}/invites`, { username: "@Bob" }); t("invite @Bob (normalised) 201", r.s === 201 && r.d.invite.invitedUser.username === "bob", r)
const inviteId = r.d.invite?.id
r = await call("alice", "POST", `/api/rooms/${id}/invites`, { username: "bob" }); t("duplicate pending 409", r.s === 409, r)
r = await call("alice", "POST", `/api/rooms/${id}/invites`, { username: "carol" }); t("invite carol", r.s === 201, r)
const carolInvite = r.d.invite?.id
r = await call("alice", "GET", `/api/search/users?q=bo&roomId=${id}`); t("search marks bob as invited", r.d.users.find((u) => u.username === "bob")?.status === "invited", r)
r = await call("alice", "GET", `/api/rooms/${id}/invites`); t("pending list has 2", r.s === 200 && r.d.invites.length === 2, r)
r = await call("bob", "GET", `/api/rooms/${id}/invites`); t("bob cannot list room invites (403)", r.s === 403, r)
r = await call("bob", "GET", "/api/notifications/unread"); t("bob got invite notification", r.d.notifications.some((n) => n.type === "invite" && n.link === "/rooms?tab=invites"), r.d)
r = await call("bob", "GET", "/api/invites"); t("bob sees 1 pending invite", r.s === 200 && r.d.count === 1 && r.d.invites[0].room.id === id, r)
r = await call("dave", "PATCH", `/api/invites/${inviteId}`, { action: "accept" }); t("dave can't answer bob's invite (404)", r.s === 404, r)
r = await call("bob", "PATCH", `/api/invites/${inviteId}`, { action: "bogus" }); t("bad action 400", r.s === 400, r)
r = await call("alice", "DELETE", `/api/rooms/${id}/invites/${carolInvite}`); t("alice revokes carol's invite", r.s === 200, r)
r = await call("carol", "PATCH", `/api/invites/${carolInvite}`, { action: "accept" }); t("carol can't accept revoked invite (409)", r.s === 409, r)
r = await call("bob", "PATCH", `/api/invites/${inviteId}`, { action: "accept" }); t("bob accepts", r.s === 200 && r.d.status === "ACCEPTED", r)
r = await call("bob", "PATCH", `/api/invites/${inviteId}`, { action: "accept" }); t("accept twice 409", r.s === 409, r)
r = await call("alice", "GET", "/api/notifications/unread"); t("alice notified bob joined", r.d.notifications.some((n) => /Bob Test joined/.test(n.message)), r.d)

console.log("# bob is now a member")
r = await call("bob", "GET", `/api/rooms/${id}`); t("bob sees room as MEMBER", r.s === 200 && r.d.room.myRole === "MEMBER" && !r.d.room.isAdmin, r)
r = await call("bob", "GET", `/api/rooms/${id}/members`); t("plain member cannot list members (403)", r.s === 403, r)
r = await call("bob", "POST", `/api/rooms/${id}/invites`, { username: "carol" }); t("plain member cannot invite (403)", r.s === 403, r)
r = await call("bob", "POST", "/api/echoes", { content: "hello from bob", roomId: id }); t("bob can post", r.s === 201, r)
const echoId = r.d.echo?.id
r = await call("alice", "PATCH", `/api/rooms/${id}`, { name: "Renamed Club" }); t("admin renames room", r.s === 200 && r.d.room.name === "Renamed Club", r)
r = await call("bob", "PATCH", `/api/rooms/${id}`, { name: "Hacked" }); t("member cannot rename (403)", r.s === 403, r)
r = await call("alice", "PATCH", `/api/rooms/${id}`, { name: "x" }); t("bad name 400", r.s === 400, r)

console.log("# invite link")
r = await call("alice", "GET", `/api/rooms/${id}/invite-link`); t("no link yet", r.s === 200 && r.d.active === false, r)
r = await call("bob", "POST", `/api/rooms/${id}/invite-link`); t("member cannot create link (403)", r.s === 403, r)
r = await call("alice", "POST", `/api/rooms/${id}/invite-link`); t("alice creates link", r.s === 200 && r.d.active && r.d.code.length === 12, r)
const code = r.d.code
r = await call(null, "GET", `/api/invites/code/${code}`); t("anon preview works", r.s === 200 && r.d.room.name === "Renamed Club" && r.d.alreadyMember === false, r)
t("preview leaks no member list / ids of others", !("members" in r.d.room))
r = await call("bob", "GET", `/api/invites/code/${code}`); t("preview says bob already member", r.d.alreadyMember === true, r)
r = await call("dave", "POST", `/api/invites/code/nope-nope-nope`); t("bad code 404", r.s === 404, r)
r = await call(null, "POST", `/api/invites/code/${code}`); t("join by link needs login (401)", r.s === 401, r)
r = await call("dave", "POST", `/api/invites/code/${code}`); t("dave joins via link", r.s === 200 && r.d.joined && r.d.memberCount === 3, r)
r = await call("dave", "POST", `/api/invites/code/${code}`); t("joining again is harmless", r.s === 200 && r.d.memberCount === 3, r)
r = await call("alice", "POST", `/api/rooms/${id}/invite-link`); const code2 = r.d.code; t("regenerate gives new code", code2 !== code, r)
r = await call("eve", "POST", `/api/invites/code/${code}`); t("old code is dead (404)", r.s === 404, r)
r = await call("alice", "DELETE", `/api/rooms/${id}/invite-link`); t("revoke link", r.s === 200 && r.d.active === false, r)
r = await call("eve", "POST", `/api/invites/code/${code2}`); t("revoked code is dead (404)", r.s === 404, r)

console.log("# roles")
r = await call("bob", "PATCH", `/api/rooms/${id}/members/u_dave`, { role: "ADMIN" }); t("member cannot promote (403)", r.s === 403, r)
r = await call("alice", "PATCH", `/api/rooms/${id}/members/u_dave`, { role: "SUPERUSER" }); t("bad role 400", r.s === 400, r)
r = await call("alice", "PATCH", `/api/rooms/${id}/members/u_eve`, { role: "ADMIN" }); t("promote non-member 404", r.s === 404, r)
r = await call("alice", "PATCH", `/api/rooms/${id}/members/u_alice`, { role: "MEMBER" }); t("owner role locked 400", r.s === 400, r)
r = await call("alice", "PATCH", `/api/rooms/${id}/members/u_bob`, { role: "ADMIN" }); t("owner promotes bob", r.s === 200 && r.d.role === "ADMIN", r)
r = await call("alice", "GET", `/api/rooms/${id}/members`); t("order: owner, admin, member", r.d.members.map((m) => m.role).join() === "OWNER,ADMIN,MEMBER", r.d.members.map((m) => m.role))
r = await call("bob", "PATCH", `/api/rooms/${id}/members/u_dave`, { role: "ADMIN" }); t("admin cannot change roles (403)", r.s === 403, r)
r = await call("bob", "POST", `/api/rooms/${id}/invites`, { username: "eve" }); t("admin bob can invite", r.s === 201, r)

console.log("# moderation + removal")
r = await call("dave", "POST", "/api/echoes", { content: "dave post", roomId: id }); const daveEcho = r.d.echo?.id; t("dave posts", r.s === 201, r)
r = await call("bob", "POST", "/api/comments", { echoId: daveEcho, content: "nice" }); const cm = r.d.comment?.id
r = await call("eve", "DELETE", `/api/echoes/${daveEcho}`); t("outsider cannot delete (403)", r.s === 403, r)
r = await call("bob", "DELETE", `/api/echoes/${daveEcho}`); t("admin bob deletes dave's echo", r.s === 200, r)
r = await call("dave", "POST", "/api/echoes", { content: "dave again", roomId: id }); const e2 = r.d.echo?.id
r = await call("alice", "POST", "/api/comments", { echoId: e2, content: "owner reply" }); const c2 = r.d.comment?.id
r = await call("bob", "DELETE", `/api/comments/${c2}`); t("admin deletes a comment in room", r.s === 200, r)
r = await call("dave", "DELETE", `/api/rooms/${id}/members/u_bob`); t("member cannot remove admin (403)", r.s === 403, r)
r = await call("bob", "DELETE", `/api/rooms/${id}/members/u_alice`); t("cannot remove owner (403)", r.s === 403, r)
r = await call("bob", "DELETE", `/api/rooms/${id}/members/u_bob`); t("cannot remove self (400)", r.s === 400, r)
r = await call("alice", "DELETE", `/api/rooms/${id}/members/u_dave`); t("owner removes dave", r.s === 200 && r.d.memberCount === 2, r)
r = await call("dave", "GET", `/api/rooms/${id}`); t("dave locked out again (403)", r.s === 403, r)
r = await call("dave", "POST", "/api/echoes", { content: "x", roomId: id }); t("dave cannot post (403)", r.s === 403, r)
r = await call("alice", "DELETE", `/api/rooms/${id}/members/u_dave`); t("remove non-member 404", r.s === 404, r)
r = await call("dave", "GET", "/api/notifications/unread"); t("dave told he was removed", r.d.notifications.some((n) => /removed from/.test(n.message)), r.d)

console.log("# leave / transfer / delete")
r = await call("alice", "DELETE", `/api/rooms/${id}/join`); t("owner cannot leave (400)", r.s === 400, r)
r = await call("bob", "POST", `/api/rooms/${id}/transfer`, { userId: "u_bob" }); t("non-owner cannot transfer (403)", r.s === 403, r)
r = await call("alice", "POST", `/api/rooms/${id}/transfer`, { userId: "u_eve" }); t("transfer to non-member 404", r.s === 404, r)
r = await call("alice", "POST", `/api/rooms/${id}/transfer`, { userId: "u_bob" }); t("transfer to bob", r.s === 200, r)
r = await call("alice", "GET", `/api/rooms/${id}`); t("alice no longer owner but still admin", r.d.room.isOwner === false && r.d.room.myRole === "ADMIN", r.d)
r = await call("alice", "DELETE", `/api/rooms/${id}`); t("alice (ex-owner) cannot delete (403)", r.s === 403, r)
r = await call("alice", "DELETE", `/api/rooms/${id}/join`); t("alice can leave now", r.s === 200, r)
r = await call("alice", "GET", `/api/rooms/${id}`); t("alice locked out after leaving (403)", r.s === 403, r)
r = await call("bob", "PATCH", `/api/rooms/${id}`, { isPublic: true }); t("owner makes it public", r.s === 200 && r.d.room.isPublic === true, r)
r = await call("bob", "PATCH", `/api/rooms/${id}`, { isPublic: false }); t("and private again", r.s === 200, r)
r = await call("bob", "DELETE", `/api/rooms/${id}`); t("owner deletes room", r.s === 200, r)
r = await call("bob", "GET", `/api/rooms/${id}`); t("room is gone (404)", r.s === 404, r)
r = await call("bob", "GET", `/api/echoes/${echoId}`); t("its echoes are gone (404)", r.s === 404, r)

console.log("# public room name clash on rename / make public")
r = await call("alice", "POST", "/api/rooms", { name: "Poetry & Verse", isPublic: true }); t("create dup public name 409", r.s === 409, r)
r = await call("alice", "POST", "/api/rooms", { name: "My Own Room " + Date.now() % 100000, isPublic: true }); const pubId = r.d.room?.id
r = await call("alice", "PATCH", `/api/rooms/${pubId}`, { name: "poetry & verse" }); t("rename into clash 409", r.s === 409, r)
r = await call("bob", "POST", `/api/rooms/${pubId}/join`); t("bob joins public", r.s === 200, r)
r = await call("alice", "GET", `/api/rooms/${pubId}/members`); t("owner lists public room members", r.s === 200 && r.d.total === 2, r)
r = await call("bob", "GET", `/api/rooms/${pubId}/members`); t("member of public room cannot list members (403)", r.s === 403, r)
r = await call("alice", "PATCH", `/api/rooms/${pubId}`, { name: "Renamed Public " + Date.now() % 100000 }); t("rename ok", r.s === 200, r)

console.log("# profile privacy (public profile excludes private room count)")
r = await call("alice", "POST", "/api/rooms", { name: "Quiet Den " + Date.now() % 100000, isPublic: false })
r = await call(null, "GET", "/api/users/alice")
const { rows: [{ n: publicRooms }] } = await db.query(`SELECT COUNT(*)::int AS n FROM "RoomMember" m JOIN "Room" r ON r.id = m."roomId" WHERE m."userId" = 'u_alice' AND r."isPublic"`)
t("profile room count counts only public rooms", r.d.user._count.roomMemberships === publicRooms, { api: r.d.user?._count, publicRooms })

console.log(`\n${pass} passed, ${fail} failed`)
await db.end()
process.exit(fail ? 1 : 0)
