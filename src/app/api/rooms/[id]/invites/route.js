import { createInvite, listRoomInvites } from "@/services/inviteService"
import { rateLimit, tooManyRequests } from "@/libs/rateLimit"
import { route, readBody, json } from "@/libs/route"

// Admin: pending invitations of this room.
export const GET = route(({ user, params }) => listRoomInvites(user.id, params.id))

// Admin: invite one person. Body: { "username": "ana_k" }
export const POST = route(async ({ req, user, params }) => {
  const limit = rateLimit(`invite:${user.id}`, 30, 60 * 60 * 1000)
  if (limit.limited) return tooManyRequests(limit, "You can send up to 30 invites per hour.")

  const invite = await createInvite(user.id, params.id, await readBody(req))
  return json({ invite }, 201)
})
