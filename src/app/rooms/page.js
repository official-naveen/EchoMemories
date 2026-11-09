"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { useToast } from "@/components/Toast"
import { api } from "@/libs/api"
import Tabs from "@/components/Tabs"
import Shell from "@/components/Shell"
import Icon from "@/components/Icon"
import Empty, { Skeletons } from "@/components/Empty"
import RoomInvites from "@/components/RoomInvites"
import { roomColor } from "@/components/Avatar"
import usePageTitle from "@/hooks/usePageTitle"

function RoomCard({ room, onJoin }) {
  return (
    <div className="card room-card hoverable">
      <div className="room-icon" style={{ background: roomColor(room.name) }}>{room.name[0].toUpperCase()}</div>
      <div className="grow">
        <h3><Link href={`/rooms/${room.id}`}>{room.name}</Link></h3>
        {room.description && <p className="desc">{room.description}</p>}
        <p className="muted">
          {room.memberCount} members · {room.echoCount} echoes {!room.isPublic && <>· <Icon name="lock" /> Private</>}
          {room.isOwner ? <> · <span className="chip owner">Owner</span></> : room.isAdmin ? <> · <span className="chip">Admin</span></> : null}
        </p>
      </div>
      {room.joined ? (
        <Link href={`/rooms/${room.id}`} className="btn small">Open</Link>
      ) : (
        <button className="btn primary small" onClick={() => onJoin(room.id)}>Join</button>
      )}
    </div>
  )
}

export default function Rooms() {
  usePageTitle("Rooms")
  const router = useRouter()
  const { me, refresh } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState("all")
  const [search, setSearch] = useState("")
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", isPublic: true })
  const [error, setError] = useState("")
  const [creating, setCreating] = useState(false)
  const [inviteCount, setInviteCount] = useState(0)

  // Notifications link here with ?tab=invites.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "invites") setTab("invites")
  }, [])

  useEffect(() => {
    if (!me) return
    api("/api/invites").then((d) => setInviteCount(d.count)).catch(() => {})
  }, [me])

  const load = useCallback(async () => {
    setLoading(true)
    const q = new URLSearchParams({ limit: "30" })
    if (search) q.set("search", search)
    if (tab === "mine") q.set("mine", "1")
    try {
      setRooms((await api(`/api/rooms?${q}`)).rooms)
    } catch {
      setRooms([])
    } finally {
      setLoading(false)
    }
  }, [search, tab])

  useEffect(() => {
    if (tab === "invites") return
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load, tab])

  async function join(id) {
    if (!me) return router.push("/login?next=/rooms")
    try {
      await api(`/api/rooms/${id}/join`, { method: "POST" })
      setRooms((r) => r.map((x) => (x.id === id ? { ...x, joined: true, memberCount: x.memberCount + 1 } : x)))
      toast("Joined room")
      refresh()
    } catch (e) {
      toast(e.message, "error")
    }
  }

  async function create(e) {
    e.preventDefault()
    setError("")
    setCreating(true)
    try {
      const { room } = await api("/api/rooms", { method: "POST", body: form })
      router.push(`/rooms/${room.id}`)
    } catch (err) {
      setError(err.message)
      setCreating(false)
    }
  }

  return (
    <Shell wide>
      <div className="row spread" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Rooms</h1>
          <p className="page-sub">Focused communities where context shapes meaning.</p>
        </div>
        {me && (
          <button className="btn primary small" onClick={() => setShowForm((s) => !s)}>
            <Icon name={showForm ? "x" : "plus"} /> {showForm ? "Cancel" : "New room"}
          </button>
        )}
      </div>

      {showForm && (
        <form className="card stack" onSubmit={create}>
          <input className="input" aria-label="Room name" placeholder="Room name" required minLength={3} maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" aria-label="Description" placeholder="What is this room about? (optional)" maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="check">
            <input type="checkbox" checked={!form.isPublic} onChange={(e) => setForm({ ...form, isPublic: !e.target.checked })} />
            Private room (only members can see it. You can invite people after creating it)
          </label>
          {error && <div className="error" role="alert">{error}</div>}
          <button className="btn primary" style={{ justifySelf: "start" }} disabled={creating}>Create room</button>
        </form>
      )}

      {tab !== "invites" && <input className="input" style={{ marginBottom: 14 }} type="search" placeholder="Search rooms…" aria-label="Search rooms" value={search} onChange={(e) => setSearch(e.target.value)} />}
      {me && (
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "all", label: "Discover" },
            { value: "mine", label: "My rooms" },
            { value: "invites", label: <>Invitations{inviteCount > 0 && <span className="count">{inviteCount}</span>}</> },
          ]}
        />
      )}

      {tab === "invites" ? (
        <RoomInvites onCountChange={setInviteCount} />
      ) : (
        <>
          {!loading && rooms.length === 0 && <Empty title="No rooms found" mascot="no-results">Try a different search, or create the room yourself.</Empty>}
          <div className="feed-grid">
            {loading && rooms.length === 0 && <Skeletons count={4} />}
            {rooms.map((r) => <RoomCard key={r.id} room={r} onJoin={join} />)}
          </div>
        </>
      )}
    </Shell>
  )
}
