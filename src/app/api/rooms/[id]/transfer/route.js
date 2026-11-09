import { transferOwnership } from "@/services/roomMemberService"
import { route, readBody } from "@/libs/route"

// Owner only. Body: { "userId": "<an existing member>" }
export const POST = route(async ({ req, user, params }) => transferOwnership(user.id, params.id, await readBody(req)))
