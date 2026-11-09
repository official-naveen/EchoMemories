import { revokeInvite } from "@/services/inviteService"
import { route } from "@/libs/route"

// Admin: withdraw a pending invitation.
export const DELETE = route(({ user, params }) => revokeInvite(user.id, params.id, params.inviteId))
