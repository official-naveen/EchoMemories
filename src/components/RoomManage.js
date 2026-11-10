"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { useToast } from "@/components/Toast"
import { api } from "@/libs/api"
import Avatar from "@/components/Avatar"
import Icon from "@/components/Icon"
import ConfirmButton from "@/components/ConfirmButton"
import { timeAgo } from "@/components/EchoCard"

/* ---------- invite people by username ---------- */
function InvitePeople({ room, onInvited }) {
  const toast = useToast()
  const [q, setQ] = useState("")
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState("")

  useEffect(() => {
    const term = q.trim().replace(/^@/, "")
    if (term.length < 2) return setResults([])
    const t = setTimeout(() => {
      api(`/api/search/users?q=${encodeURIComponent(term)}&roomId=${room.id}`)
        .then((d) => setResults(d.users))
        .catch(() => setResults([]))
    }, 250)
    return () => clearTimeout(t)
  }, [q, room.id])

  async function invite(username) {
    setBusy(username)
    try {
      await api(`/api/rooms/${room.id}/invites`, { method: "POST", body: { username } })
      toast(`Invitation sent to @${username}`)
      setResults((r) => r.map((u) => (u.username === username ? { ...u, status: "invited" } : u)))
      onInvited()
    } catch (e) {
      toast(e.message, "error")
    } finally {
      setBusy("")
    }
  }

  return (
    <section className="manage-section">
      <h3>Invite people</h3>
      <p className="muted">Search by name or @username. They get a notification and can accept or decline.</p>
      <input className="input" type="search" placeholder="Search people…" aria-label="Search people to invite" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim().replace(/^@/, "").length >= 2 && (
        <div className="results">
          {results.length === 0 && <p className="muted">No one found.</p>}
          {results.map((u) => (
            <div key={u.id} className="person">
              <Avatar name={u.fullName} seed={u.username} size="sm" />
              <div className="who">
                <strong>{u.fullName}</strong>
                <div className="muted">@{u.username}</div>
              </div>
              {u.status === "member" && <span className="chip quiet">Already a member</span>}
              {u.status === "invited" && <span className="chip quiet">Invited</span>}
              {!u.status && (
                <button className="btn primary small" disabled={busy === u.username} onClick={() => invite(u.username)}>
                  <Icon name="userPlus" /> Invite
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ---------- shareable link ---------- */
function InviteLink({ room }) {
  const toast = useToast()
  const [link, setLink] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api(`/api/rooms/${room.id}/invite-link`).then(setLink).catch(() => setLink({ active: false }))
  }, [room.id])

  async function run(method, message) {
    setBusy(true)
    try {
      setLink(await api(`/api/rooms/${room.id}/invite-link`, { method }))
      if (message) toast(message)
    } catch (e) {
      toast(e.message, "error")
    } finally {
      setBusy(false)
    }
  }

  const url = link?.active ? `${window.location.origin}${link.path}` : ""
  const days = link?.active ? Math.max(1, Math.ceil((new Date(link.expiresAt) - Date.now()) / 86400000)) : 0

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast("Link copied")
    } catch {
      toast("Couldn't copy. Select the link and copy it manually.", "error")
    }
  }

  return (
    <section className="manage-section">
      <h3>Invite link</h3>
      <p className="muted">Anyone who is logged in and opens this link can join{room.isPublic ? "" : ", even though the room is private"}. Turn it off when you no longer need it.</p>
      {!link ? null : link.active ? (
        <>
          <div className="copy-field">
            <input className="input" readOnly value={url} aria-label="Invite link" onFocus={(e) => e.target.select()} />
            <button className="btn" onClick={copy}><Icon name="copy" /> Copy</button>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <span className="muted">Expires in {days} {days === 1 ? "day" : "days"}</span>
            <button className="btn small" disabled={busy} onClick={() => run("POST", "New link created. The old one no longer works")}>New link</button>
            <ConfirmButton confirmLabel="Turn off?" disabled={busy} onConfirm={() => run("DELETE", "Invite link turned off")}>Turn off</ConfirmButton>
          </div>
        </>
      ) : (
        <button className="btn" disabled={busy} onClick={() => run("POST", "Invite link created")}><Icon name="link" /> Create invite link</button>
      )}
    </section>
  )
}

/* ---------- pending invitations ---------- */
function PendingInvites({ room, reloadKey }) {
  const toast = useToast()
  const [invites, setInvites] = useState([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(() => {
    api(`/api/rooms/${room.id}/invites`)
      .then((d) => setInvites(d.invites))
      .catch(() => setInvites([]))
      .finally(() => setLoaded(true))
  }, [room.id])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  async function revoke(inv) {
    try {
      await api(`/api/rooms/${room.id}/invites/${inv.id}`, { method: "DELETE" })
      setInvites((l) => l.filter((x) => x.id !== inv.id))
      toast("Invitation withdrawn")
    } catch (e) {
      toast(e.message, "error")
      load()
    }
  }

  return (
    <section className="manage-section">
      <h3>Pending invitations {loaded && invites.length > 0 && <span className="chip quiet">{invites.length}</span>}</h3>
      <p className="muted">People you invited who haven&rsquo;t answered yet.</p>
      {loaded && invites.length === 0 && <p className="muted">No pending invitations.</p>}
      {invites.map((i) => (
        <div key={i.id} className="person">
          <Avatar name={i.invitedUser.fullName} seed={i.invitedUser.username} size="sm" />
          <div className="who">
            <strong>{i.invitedUser.fullName}</strong>
            <div className="muted">@{i.invitedUser.username} · invited {timeAgo(i.createdAt)} by @{i.invitedBy.username}</div>
          </div>
          <button className="btn small" onClick={() => revoke(i)}>Withdraw</button>
        </div>
      ))}
    </section>
  )
}

/* ---------- name / description / visibility ---------- */
function Settings({ room, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({ name: room.name, description: room.description || "", isPublic: room.isPublic, rules: room.rules || "", allowAnonymous: room.allowAnonymous })
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function save(e) {
    e.preventDefault()
    setError("")
    setBusy(true)
    try {
      const body = { name: form.name, description: form.description, rules: form.rules, allowAnonymous: form.allowAnonymous }
      if (room.isOwner) body.isPublic = form.isPublic
      await api(`/api/rooms/${room.id}`, { method: "PATCH", body })
      toast("Room updated")
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="manage-section">
      <h3>Room details</h3>
      <form className="card stack" onSubmit={save}>
        <input className="input" aria-label="Room name" required minLength={3} maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" aria-label="Description" placeholder="What is this room about? (optional)" maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <textarea className="input" aria-label="Room rules" placeholder={"Room rules (optional), one per line. For example:\n1. Be kind.\n2. Stay on topic.\n3. No spam."} rows={6} maxLength={1000} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
        <label className="check">
          <input type="checkbox" checked={form.allowAnonymous} onChange={(e) => setForm({ ...form, allowAnonymous: e.target.checked })} />
          Allow anonymous posts and replies in this room
        </label>
        {room.isOwner ? (
          <label className="check">
            <input type="checkbox" checked={!form.isPublic} onChange={(e) => setForm({ ...form, isPublic: !e.target.checked })} />
            Private room (only members can see it)
          </label>
        ) : (
          <p className="muted">Only the owner can change whether the room is private.</p>
        )}
        {error && <div className="error" role="alert">{error}</div>}
        <button className="btn primary small" style={{ justifySelf: "start" }} disabled={busy}>Save changes</button>
      </form>
    </section>
  )
}

/* ---------- owner-only: transfer + delete ---------- */
function DangerZone({ room }) {
  const router = useRouter()
  const { refresh } = useAuth()
  const toast = useToast()
  const [members, setMembers] = useState([])
  const [target, setTarget] = useState("")
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api(`/api/rooms/${room.id}/members?limit=100`)
      .then((d) => setMembers(d.members.filter((m) => !m.isMe)))
      .catch(() => {})
  }, [room.id])

  async function transfer() {
    setBusy(true)
    try {
      await api(`/api/rooms/${room.id}/transfer`, { method: "POST", body: { userId: target } })
      toast("Ownership transferred")
      window.location.reload()
    } catch (e) {
      toast(e.message, "error")
      setBusy(false)
    }
  }

  async function destroy() {
    setBusy(true)
    try {
      await api(`/api/rooms/${room.id}`, { method: "DELETE" })
      toast("Room deleted")
      await refresh()
      router.push("/rooms")
    } catch (e) {
      toast(e.message, "error")
      setBusy(false)
    }
  }

  return (
    <section className="manage-section">
      <div className="card danger-zone stack">
        <h3>Owner actions</h3>
        <div>
          <strong>Transfer ownership</strong>
          <p className="muted" style={{ margin: "2px 0 8px" }}>The new owner can manage roles and delete the room. You stay on as an admin and can then leave.</p>
          <div className="row">
            <select className="input select-sm" style={{ marginBottom: 0 }} aria-label="New owner" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Choose a member…</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.fullName} (@{m.username})</option>)}
            </select>
            <ConfirmButton className="btn small danger" confirmLabel="Transfer?" disabled={!target || busy} onConfirm={transfer}>Transfer</ConfirmButton>
          </div>
        </div>
        <div>
          <strong>Delete this room</strong>
          <p className="muted" style={{ margin: "2px 0 8px" }}>Permanently deletes the room, all of its echoes and replies. Type <b>{room.name}</b> to confirm.</p>
          <div className="row">
            <input className="input" style={{ maxWidth: 260 }} aria-label="Type the room name to confirm" placeholder={room.name} value={typed} onChange={(e) => setTyped(e.target.value)} />
            <button className="btn small danger armed" disabled={typed.trim() !== room.name || busy} onClick={destroy}>Delete room</button>
          </div>
        </div>
      </div>
    </section>
  )
}

// Everything an admin can do, in one place. Rendered only for admins.
export default function RoomManage({ room, onChanged }) {
  const [pendingKey, setPendingKey] = useState(0)
  return (
    <div>
      <InvitePeople room={room} onInvited={() => setPendingKey((k) => k + 1)} />
      <InviteLink room={room} />
      <PendingInvites room={room} reloadKey={pendingKey} />
      <Settings room={room} onSaved={onChanged} />
      {room.isOwner && <DangerZone room={room} />}
    </div>
  )
}
