import { joinByInviteLink, previewInviteLink } from "@/services/inviteService"
import { clientIp, rateLimit, tooManyRequests } from "@/libs/rateLimit"
import { route } from "@/libs/route"

// Both calls are throttled per IP so codes can't be guessed by brute force.
function throttle(req) {
  const limit = rateLimit(`invitecode:${clientIp(req)}`, 30, 10 * 60 * 1000)
  return limit.limited ? tooManyRequests(limit) : null
}

// What the invite page shows: the room's name, description and size.
export const GET = route(({ req, user, params }) => throttle(req) || previewInviteLink(user?.id, params.code), { auth: false })

// Join the room through the link (login required).
export const POST = route(({ req, user, params }) => throttle(req) || joinByInviteLink(user.id, params.code))
