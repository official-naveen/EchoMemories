"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import { api } from "@/libs/api"
import Shell from "@/components/Shell"
import Avatar from "@/components/Avatar"
import Icon from "@/components/Icon"
import Empty, { Skeletons } from "@/components/Empty"
import usePageTitle from "@/hooks/usePageTitle"

export default function Leaderboard() {
  usePageTitle("Pulse")
  const { me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    api("/api/pulse/leaderboard?limit=50")
      .then((d) => setUsers(d.users || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <h1 className="page-title">Pulse</h1>
      <p className="page-sub">How present each person is right now. It grows when you post, reply, get mentioned and show up daily.</p>
      {error && <div className="alert" role="alert">{error}</div>}
      {loading && <Skeletons count={3} />}
      {!loading && !error && users.length === 0 && <Empty title="No one here yet" mascot="achievement">Be the first on the board.</Empty>}
      {users.map((u) => (
        <div key={u.id} className={`board-row${u.id === me?.id ? " me" : ""}`}>
          <span className={`rank top${u.rank}`}>{u.rank}</span>
          <Avatar name={u.fullName} seed={u.username} size="sm" />
          <div>
            <Link href={`/u/${u.username}`}><strong>{u.fullName}</strong></Link>
            <div className="muted"><Icon name="flame" /> {u.streakDays}-day streak · @{u.username}</div>
          </div>
          <span className="score">{u.pulseScore.toFixed(1)}</span>
        </div>
      ))}
    </Shell>
  )
}
