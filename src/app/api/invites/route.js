import { listMyInvites } from "@/services/inviteService"
import { route } from "@/libs/route"

// The invitations waiting for me.
export const GET = route(({ user }) => listMyInvites(user.id))
