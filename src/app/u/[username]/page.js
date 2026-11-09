"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { api } from "@/libs/api"
import { timeAgo } from "@/components/EchoCard"
import Shell from "@/components/Shell"
import Avatar from "@/components/Avatar"
import Icon from "@/components/Icon"
import Empty, { Skeletons } from "@/components/Empty"
import usePageTitle from "@/hooks/usePageTitle"

export default function Profile({ params }) {
  const { username } = use(params)
  const [user, setUser] = useState(null)
  const [error, setError] = useState("")
  usePageTitle(user ? `${user.fullName} (@${user.username})` : "Profile")

  useEffect(() => {
    api(`/api/users/${username}`)
      .then((d) => setUser(d.user))
      .catch((e) => setError(e.message || "User not found"))
  }, [username])

  if (error) return <Shell><Empty title="Profile not found" mascot="no-results">{error}</Empty></Shell>
  if (!user) return <Shell><Skeletons count={1} /></Shell>

  return (
    <Shell>
      <div className="row" style={{ gap: 18 }}>
        <Avatar name={user.fullName} seed={user.username} size="lg" />
        <div>
          <h1 className="page-title">{user.fullName}</h1>
          <p className="muted">@{user.username}{user.country ? ` · ${user.country}` : ""} · joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p>
        </div>
      </div>
      {user.bio && <p className="bio">{user.bio}</p>}

      <div className="stats">
        <div className="stat"><strong>{user.pulseScore.toFixed(1)}</strong><span>Pulse</span></div>
        <div className="stat"><strong>#{user.rank}</strong><span>Rank</span></div>
        <div className="stat"><strong>{user.streakDays}</strong><span>Day streak</span></div>
        <div className="stat"><strong>{user._count.roomMemberships}</strong><span>Rooms</span></div>
      </div>

      <h2 className="section-title" style={{ marginBottom: 4 }}>Room echoes</h2>
      <p className="muted" style={{ marginBottom: 12 }}>Echoes in Space are anonymous and never appear on profiles.</p>
      {user.echoes.length === 0 && <Empty title="No public room echoes yet" mascot="empty-posts">When {user.fullName.split(" ")[0]} posts in a public room, it will show up here.</Empty>}
      {user.echoes.map((e) => (
        <article key={e.id} className="card hoverable">
          <div className="echo-head" style={{ marginBottom: 8 }}>
            <div className="meta muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span>{timeAgo(e.createdAt)}</span><Link className="chip" href={`/rooms/${e.room.id}`}>{e.room.name}</Link>
            </div>
          </div>
          {e.title && <h3 className="echo-title"><Link href={`/echo/${e.id}`}>{e.title}</Link></h3>}
          <p className="echo-body">{e.content.length > 280 ? e.content.slice(0, 280) + "…" : e.content}</p>
          <div className="echo-actions">
            <Link className="act" href={`/echo/${e.id}`}><Icon name="ripple" /> {e._count.resonations}</Link>
            <Link className="act" href={`/echo/${e.id}`}><Icon name="comment" /> {e._count.comments}</Link>
          </div>
        </article>
      ))}
    </Shell>
  )
}
