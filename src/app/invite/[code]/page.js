"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { useToast } from "@/components/Toast"
import { api } from "@/libs/api"
import Shell from "@/components/Shell"
import Icon from "@/components/Icon"
import Empty from "@/components/Empty"
import { roomColor } from "@/components/Avatar"
import usePageTitle from "@/hooks/usePageTitle"

// Landing page for a shared invite link: /invite/<code>
export default function InvitePage({ params }) {
  usePageTitle("Room invitation")
  const { code } = use(params)
  const router = useRouter()
  const { me, loading: authLoading, refresh } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (authLoading) return
    api(`/api/invites/code/${code}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [code, authLoading, me?.id])

  async function join() {
    setBusy(true)
    try {
      const r = await api(`/api/invites/code/${code}`, { method: "POST" })
      toast("Welcome to the room")
      await refresh()
      router.push(`/rooms/${r.roomId}`)
    } catch (e) {
      toast(e.message, "error")
      setBusy(false)
    }
  }

  if (error) {
    return (
      <Shell rail={false}>
        <Empty title="Invitation unavailable" mascot="no-results">
          {error}
          <div><Link href="/rooms" className="btn">Browse rooms</Link></div>
        </Empty>
      </Shell>
    )
  }
  if (!data) return <Shell rail={false}><div className="skel" style={{ height: 180, borderRadius: 16 }} /></Shell>

  const { room, alreadyMember } = data
  return (
    <Shell rail={false}>
      <div className="card stack" style={{ textAlign: "center", justifyItems: "center", padding: 32 }}>
        <div className="room-icon" style={{ background: roomColor(room.name), width: 64, height: 64, fontSize: "1.6rem" }}>{room.name[0].toUpperCase()}</div>
        <p className="muted">You&rsquo;ve been invited to join</p>
        <h1 className="page-title" style={{ margin: 0 }}>{room.name} {!room.isPublic && <Icon name="lock" />}</h1>
        {room.description && <p>{room.description}</p>}
        <p className="muted">{room.memberCount} members · created by @{room.createdBy.username}</p>

        {alreadyMember ? (
          <Link href={`/rooms/${room.id}`} className="btn primary big">Open room</Link>
        ) : me ? (
          <button className="btn primary big" disabled={busy} onClick={join}>{busy ? "Joining…" : "Join room"}</button>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(`/invite/${code}`)}`} className="btn primary big">Log in to join</Link>
        )}
      </div>
    </Shell>
  )
}
