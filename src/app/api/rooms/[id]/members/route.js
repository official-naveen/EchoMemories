import { listMembers } from "@/services/roomMemberService"
import { route } from "@/libs/route"

// Who is in this room. Room owner and admins only.
// Query: ?search=ana&page=1&limit=30
export const GET = route(({ req, user, params }) => listMembers(req, user.id, params.id))
