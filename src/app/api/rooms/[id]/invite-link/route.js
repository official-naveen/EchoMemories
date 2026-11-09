import { createInviteLink, getInviteLink, revokeInviteLink } from "@/services/inviteService"
import { rateLimit, tooManyRequests } from "@/libs/rateLimit"
import { route } from "@/libs/route"

// Admin: current shareable link (or { active: false }).
export const GET = route(({ user, params }) => getInviteLink(user.id, params.id))

// Admin: create a new link (replaces the old one). Valid for 7 days.
export const POST = route(({ user, params }) => {
  const limit = rateLimit(`invitelink:${user.id}`, 10, 60 * 60 * 1000)
  if (limit.limited) return tooManyRequests(limit)
  return createInviteLink(user.id, params.id)
})

// Admin: turn the link off.
export const DELETE = route(({ user, params }) => revokeInviteLink(user.id, params.id))
