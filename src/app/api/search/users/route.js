import { searchUsers } from "@/services/inviteService"
import { rateLimit, tooManyRequests } from "@/libs/rateLimit"
import { route } from "@/libs/route"

// Find people to invite. Query: ?q=ana&roomId=<room> (roomId is optional;
// admins of that room also get each person's "member"/"invited" status).
export const GET = route(({ req, user }) => {
  const limit = rateLimit(`usersearch:${user.id}`, 60, 60_000)
  if (limit.limited) return tooManyRequests(limit)

  const { searchParams } = new URL(req.url)
  return searchUsers(user.id, { q: searchParams.get("q") || "", roomId: searchParams.get("roomId") || "" })
})
