"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { useToast } from "@/components/Toast"
import { api } from "@/libs/api"
import Icon from "@/components/Icon"
import Empty, { Skeletons } from "@/components/Empty"
import { roomColor } from "@/components/Avatar"
import { timeAgo } from "@/components/EchoCard"

// Invitations other people sent me. Accepting joins the room right away.
export default function RoomInvites({ onCountChange }) {
  const router = useRouter()
  const { refresh } = useAuth()
  const toast = useToast()
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState("")

  const load = useCallback(async () => {
    try {
      const d = await api("/api/invites")
      setInvites(d.invites)
      onCountChange?.(d.count)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    load()
  }, [load])

  async function answer(invite, action) {
    setBusyId(invite.id)
    try {
      await api(`/api/invites/${invite.id}`, { method: "PATCH", body: { action } })
      if (action === "accept") {
        toast(`You joined ${invite.room.name}`)
        await refresh()
        router.push(`/rooms/${invite.room.id}`)
        return
      }
      toast("Invitation declined")
      setInvites((list) => {
        const next = list.filter((i) => i.id !== invite.id)
        onCountChange?.(next.length)
        return next
      })
    } catch (e) {
      toast(e.message, "error")
      load() // it may have been withdrawn in the meantime
    } finally {
      setBusyId("")
    }
  }

  if (loading) return <Skeletons count={2} />
  if (error) return <div className="error" role="alert">{error}</div>
  if (invites.length === 0) return <Empty title="No invitations" mascot="empty-notifications">When a room admin invites you, it will show up here.</Empty>

  return invites.map((i) => (
    <div key={i.id} className="card invite-card">
      <div className="room-icon" style={{ background: roomColor(i.room.name) }}>{i.room.name[0].toUpperCase()}</div>
      <div className="grow">
        <h3>{i.room.name} {!i.room.isPublic && <Icon name="lock" />}</h3>
        {i.room.description && <p className="muted" style={{ marginTop: 2 }}>{i.room.description}</p>}
        <p className="muted">
          Invited by <Link href={`/u/${i.invitedBy.username}`}>@{i.invitedBy.username}</Link> · {timeAgo(i.createdAt)} · {i.room.memberCount} members
        </p>
      </div>
      <div className="acts">
        <button className="btn primary small" disabled={busyId === i.id} onClick={() => answer(i, "accept")}>Accept</button>
        <button className="btn small" disabled={busyId === i.id} onClick={() => answer(i, "decline")}>Decline</button>
      </div>
    </div>
  ))
}
