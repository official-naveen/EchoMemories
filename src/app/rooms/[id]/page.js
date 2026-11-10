"use client"

import { useCallback, useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { useToast } from "@/components/Toast"
import { api } from "@/libs/api"
import Composer from "@/components/Composer"
import RoomMembers from "@/components/RoomMembers"
import RoomManage from "@/components/RoomManage"
import FeedList from "@/components/FeedList"
import Tabs from "@/components/Tabs"
import Shell from "@/components/Shell"
import Icon from "@/components/Icon"
import Empty from "@/components/Empty"
import usePageTitle from "@/hooks/usePageTitle"

export default function RoomPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const { me, refresh } = useAuth()
  const toast = useToast()
  const [room, setRoom] = useState(null)
  const [error, setError] = useState("")
  const [sort, setSort] = useState("latest")
  const [view, setView] = useState("echoes") // echoes | members | manage
  const [key, setKey] = useState(0)
  usePageTitle(room?.name || "Room")

  const loadRoom = useCallback(
    () =>
      api(`/api/rooms/${id}`)
        .then((d) => setRoom(d.room))
        .catch((e) => setError(e.message || "Room not found")),
    [id]
  )

  useEffect(() => {
    loadRoom()
  }, [loadRoom, me?.id])

  async function membership(method) {
    if (!me) return router.push(`/login?next=/rooms/${id}`)
    try {
      const data = await api(`/api/rooms/${id}/join`, { method })
      toast(data.joined ? "Welcome to the room" : "You left the room")
      refresh()
      // Nobody can see a private room they just left, so go back to the list.
      if (!data.joined && !room.isPublic) return router.push("/rooms")
      await loadRoom()
    } catch (e) {
      toast(e.message, "error")
    }
  }

  if (error) {
    return (
      <Shell wide>
        <Empty title="Room unavailable" mascot="no-results">
          {error}
          <div><Link href="/rooms" className="btn">All rooms</Link></div>
        </Empty>
      </Shell>
    )
  }
  if (!room) return <Shell wide><div className="skel" style={{ height: 140, borderRadius: 16 }} /></Shell>

  return (
    <Shell wide>
      <Link href="/rooms" className="back"><Icon name="back" /> All rooms</Link>
      <div className="room-hero">
        <div className="row spread" style={{ alignItems: "flex-start" }}>
          <div>
            <h1>
              {room.name} {!room.isPublic && <Icon name="lock" />}
              {room.isOwner ? <span className="chip owner"><Icon name="crown" /> Owner</span> : room.isAdmin ? <span className="chip">Admin</span> : null}
            </h1>
            {room.description && <p style={{ marginTop: 4 }}>{room.description}</p>}
            <p className="muted" style={{ marginTop: 8 }}>
              {room.memberCount} members · {room.echoCount} echoes · by <Link href={`/u/${room.createdBy.username}`}>@{room.createdBy.username}</Link>
            </p>
          </div>
          <div className="actions">
            {room.isAdmin && (
              <button className="btn small" onClick={() => setView("manage")}><Icon name="userPlus" /> Invite</button>
            )}
            {room.joined ? (
              !room.isOwner && <button className="btn small" onClick={() => membership("DELETE")}>Leave</button>
            ) : (
              <button className="btn primary small" onClick={() => membership("POST")}>Join room</button>
            )}
          </div>
        </div>
      </div>

      <Tabs
        value={view}
        onChange={setView}
        tabs={[
          { value: "echoes", label: "Echoes" },
          { value: "rules", label: "Rules" },
          ...(room.isAdmin
            ? [
                { value: "members", label: `Members (${room.memberCount})` },
                { value: "manage", label: "Manage" },
              ]
            : []),
        ]}
      />

      {view === "echoes" && (
        <>
          {room.joined && <Composer fixedRoomId={room.id} fixedRoomAllowsAnonymous={room.allowAnonymous} onPosted={() => { setSort("latest"); setKey((k) => k + 1) }} />}
          <div className="row spread" style={{ marginBottom: 6 }}>
            <span className="muted">Sort by</span>
            <select className="input select-sm" style={{ marginBottom: 0 }} aria-label="Sort echoes" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="latest">Latest</option>
              <option value="discussed">Most discussed</option>
              <option value="saved">Most saved</option>
            </select>
          </div>
          <FeedList url={`/api/rooms/${id}/echoes?sort=${sort}`} reloadKey={key} empty="No echoes in this room yet. Start the conversation." />
        </>
      )}

      {view === "rules" && (
        <section className="card stack">
          <h2 className="section-title" style={{ margin: 0 }}>Room rules</h2>
          {room.rules ? (
            <p className="rules-box">{room.rules}</p>
          ) : (
            <p className="muted">The admins haven&apos;t written any rules yet. Be kind and stay on topic.</p>
          )}
          <p className="muted">{room.allowAnonymous ? "Members may post and reply anonymously here." : "Anonymous posts and replies are turned off in this room."}</p>
          {room.isAdmin && <button className="btn small" style={{ justifySelf: "start" }} onClick={() => setView("manage")}>Edit rules</button>}
        </section>
      )}
      {view === "members" && room.isAdmin && <RoomMembers roomId={room.id} onChanged={loadRoom} />}
      {view === "manage" && room.isAdmin && <RoomManage room={room} onChanged={loadRoom} />}
    </Shell>
  )
}
