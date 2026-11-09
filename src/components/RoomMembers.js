"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useToast } from "@/components/Toast"
import { api } from "@/libs/api"
import Avatar from "@/components/Avatar"
import Icon from "@/components/Icon"
import Empty, { Skeletons } from "@/components/Empty"
import ConfirmButton from "@/components/ConfirmButton"

function RoleChip({ role }) {
  if (role === "OWNER") return <span className="chip owner"><Icon name="crown" /> Owner</span>
  if (role === "ADMIN") return <span className="chip">Admin</span>
  return null
}

// The member list of a room (owner and admins only), with tools to promote,
// remove or hand over ownership.
export default function RoomMembers({ roomId, onChanged }) {
  const toast = useToast()
  const [search, setSearch] = useState("")
  const [members, setMembers] = useState([])
  const [viewer, setViewer] = useState({})
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState("")
  const latest = useRef(0)

  const load = useCallback(
    async (p, replace) => {
      const ticket = ++latest.current
      setLoading(true)
      setError("")
      try {
        const q = new URLSearchParams({ page: String(p), limit: "30" })
        if (search.trim()) q.set("search", search.trim())
        const d = await api(`/api/rooms/${roomId}/members?${q}`)
        if (ticket !== latest.current) return
        setMembers((prev) => (replace ? d.members : [...prev, ...d.members]))
        setViewer(d.viewer)
        setTotal(d.total)
        setHasMore(d.hasMore)
        setPage(p)
      } catch (e) {
        if (ticket === latest.current) setError(e.message)
      } finally {
        if (ticket === latest.current) setLoading(false)
      }
    },
    [roomId, search]
  )

  useEffect(() => {
    const t = setTimeout(() => load(1, true), search ? 250 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  async function act(member, request, success) {
    setBusyId(member.id)
    try {
      await request()
      toast(success)
      await load(1, true)
      onChanged?.()
    } catch (e) {
      toast(e.message, "error")
    } finally {
      setBusyId("")
    }
  }

  const setRole = (m, role) =>
    act(m, () => api(`/api/rooms/${roomId}/members/${m.id}`, { method: "PATCH", body: { role } }), role === "ADMIN" ? `@${m.username} is now an admin` : `@${m.username} is no longer an admin`)
  const remove = (m) =>
    act(m, () => api(`/api/rooms/${roomId}/members/${m.id}`, { method: "DELETE" }), `Removed @${m.username}`)
  const makeOwner = (m) =>
    act(m, () => api(`/api/rooms/${roomId}/transfer`, { method: "POST", body: { userId: m.id } }), `@${m.username} is now the owner`)

  return (
    <div>
      <input
        className="input"
        style={{ marginBottom: 14 }}
        type="search"
        placeholder="Search members…"
        aria-label="Search members"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {!error && <p className="muted" style={{ marginBottom: 10 }}>{total} {total === 1 ? "member" : "members"}</p>}

      {error && <div className="error" role="alert">{error}</div>}
      {loading && members.length === 0 && <Skeletons count={2} />}
      {!loading && !error && members.length === 0 && <Empty title="No members found" mascot="no-results">Try a different name.</Empty>}

      {members.map((m) => {
        const canRemove = viewer.isAdmin && !m.isMe && m.role !== "OWNER" && (viewer.isOwner || m.role === "MEMBER")
        const busy = busyId === m.id
        return (
          <div key={m.id} className="person">
            <Avatar name={m.fullName} seed={m.username} size="sm" />
            <div className="who">
              <div className="name-line">
                <Link href={`/u/${m.username}`}><strong>{m.fullName}</strong></Link>
                {m.isMe && <span className="chip quiet">You</span>}
                <RoleChip role={m.role} />
              </div>
              <div className="muted">@{m.username} · joined {new Date(m.joinedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</div>
            </div>
            {(viewer.isOwner && !m.isMe && m.role !== "OWNER") || canRemove ? (
              <div className="acts">
                {viewer.isOwner && !m.isMe && m.role !== "OWNER" && (
                  <>
                    <button className="btn small" disabled={busy} onClick={() => setRole(m, m.role === "ADMIN" ? "MEMBER" : "ADMIN")}>
                      {m.role === "ADMIN" ? "Remove admin" : "Make admin"}
                    </button>
                    <ConfirmButton className="btn small" confirmLabel="Make owner?" disabled={busy} onConfirm={() => makeOwner(m)}>Make owner</ConfirmButton>
                  </>
                )}
                {canRemove && <ConfirmButton confirmLabel="Remove?" disabled={busy} onConfirm={() => remove(m)}>Remove</ConfirmButton>}
              </div>
            ) : null}
          </div>
        )
      })}

      {!loading && hasMore && (
        <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
          <button className="btn" onClick={() => load(page + 1, false)}>Load more</button>
        </div>
      )}
    </div>
  )
}
