import { removeMember, setMemberRole } from "@/services/roomMemberService"
import { route, readBody } from "@/libs/route"

// Owner only. Body: { "role": "ADMIN" | "MEMBER" }
export const PATCH = route(async ({ req, user, params }) =>
  setMemberRole(user.id, params.id, params.userId, await readBody(req))
)

// Admin removes a member (only the owner may remove another admin).
export const DELETE = route(({ user, params }) => removeMember(user.id, params.id, params.userId))
