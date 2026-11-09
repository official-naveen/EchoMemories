"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import { api } from "@/libs/api"
import Icon from "@/components/Icon"
import { roomColor } from "@/components/Avatar"

export default function Rail() {
  const { me, loading } = useAuth()
  const [pulse, setPulse] = useState(null)
  const [suggested, setSuggested] = useState([])

  useEffect(() => {
    if (!me) return
    api(`/api/pulse/${me.id}`).then(setPulse).catch(() => {})
  }, [me])

  useEffect(() => {
    api("/api/rooms?random=1&limit=4")
      .then((d) => setSuggested((d.rooms || []).filter((r) => !r.joined)))
      .catch(() => {})
  }, [me?.id])

  const myRooms = (me?.roomMemberships || []).map((m) => m.room).slice(0, 5)
  const streak = Math.min(me?.streakDays || 0, 7)

  return (
    <aside className="rail" aria-label="Sidebar">
      {!loading && me && (
        <section className="card pulse-card">
          <h4>Your Pulse</h4>
          <div className="pulse-score">{(pulse?.pulseScore ?? me.pulseScore).toFixed(1)}</div>
          <div className="pulse-meta">
            {pulse ? `Rank #${pulse.rank}` : "…"} · <Icon name="flame" /> {me.streakDays}-day streak
          </div>
          <div className="week" aria-label={`${streak} of 7 days`}>
            {Array.from({ length: 7 }).map((_, i) => <i key={i} className={i < streak ? "on" : ""} />)}
          </div>
          <Link href="/leaderboard" className="muted">View leaderboard →</Link>
        </section>
      )}

      {!loading && !me && (
        <section className="card">
          <h4>Join in</h4>
          <p className="rail-note" style={{ marginBottom: 12 }}>Create an account to post, join rooms and grow your Pulse.</p>
          <Link href="/signup" className="btn primary block">Sign up free</Link>
        </section>
      )}

      {myRooms.length > 0 && (
        <section className="rail-section">
          <h4>Your rooms</h4>
          {myRooms.map((r) => (
            <Link key={r.id} href={`/rooms/${r.id}`} className="mini-room">
              <span className="room-icon" style={{ background: roomColor(r.name) }}>{r.name[0].toUpperCase()}</span>
              <span>{r.name}</span>
            </Link>
          ))}
        </section>
      )}

      {suggested.length > 0 && (
        <section className="rail-section">
          <h4>Discover</h4>
          {suggested.map((r) => (
            <Link key={r.id} href={`/rooms/${r.id}`} className="mini-room">
              <span className="room-icon" style={{ background: roomColor(r.name) }}>{r.name[0].toUpperCase()}</span>
              <span>{r.name}<br /><span className="muted">{r.memberCount} members</span></span>
            </Link>
          ))}
        </section>
      )}
    </aside>
  )
}
