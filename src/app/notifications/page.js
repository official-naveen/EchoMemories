"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRequireAuth } from "@/components/AuthProvider"
import { api } from "@/libs/api"
import { timeAgo } from "@/components/EchoCard"
import Shell from "@/components/Shell"
import Icon from "@/components/Icon"
import Empty, { Skeletons } from "@/components/Empty"
import usePageTitle from "@/hooks/usePageTitle"

const ICONS = { mention: "user", comment: "comment", resonate: "ripple", invite: "userPlus", room: "rooms" }

export default function Notifications() {
  usePageTitle("Alerts")
  const { me } = useRequireAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!me) return
    api("/api/notifications?limit=50")
      .then((d) => setItems(d.notifications || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [me])

  async function readAll() {
    await api("/api/notifications/read-all", { method: "POST" }).catch(() => {})
    setItems((i) => i.map((n) => ({ ...n, isRead: true })))
  }

  function readOne(n) {
    if (n.isRead) return
    api(`/api/notifications/${n.id}`, { method: "PATCH" }).catch(() => {})
    setItems((i) => i.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
  }

  return (
    <Shell>
      <div className="row spread" style={{ alignItems: "flex-start" }}>
        <h1 className="page-title">Alerts</h1>
        <button className="btn small" onClick={readAll} disabled={!items.some((n) => !n.isRead)}>
          <Icon name="check" /> Mark all read
        </button>
      </div>
      <p className="page-sub">Replies, resonances, mentions and room invitations.</p>

      {error && <div className="alert" role="alert">{error}</div>}
      {loading && <Skeletons count={2} />}
      {!loading && !error && items.length === 0 && <Empty title="All quiet" mascot="empty-notifications">Echoes you post will bring replies and resonance here.</Empty>}
      {items.map((n) => (
        <div key={n.id} className={`notif${n.isRead ? "" : " unread"}`}>
          <div className="ico"><Icon name={ICONS[n.type] || "bell"} /></div>
          <div className="txt">
            {n.link ? <Link href={n.link} onClick={() => readOne(n)}>{n.message}</Link> : n.message}
            <div className="muted">{timeAgo(n.createdAt)}</div>
          </div>
        </div>
      ))}
    </Shell>
  )
}
