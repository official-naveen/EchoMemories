import { respondToInvite } from "@/services/inviteService"
import { route, readBody } from "@/libs/route"

// Answer an invitation. Body: { "action": "accept" | "decline" }
export const PATCH = route(async ({ req, user, params }) => respondToInvite(user.id, params.inviteId, await readBody(req)))
