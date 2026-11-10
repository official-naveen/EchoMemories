"use client"

import { useCallback, useEffect, useState, use } from "react"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import { api } from "@/libs/api"
import EchoCard from "@/components/EchoCard"
import ReplyThread, { ReplyForm } from "@/components/ReplyThread"
import Shell from "@/components/Shell"
import Icon from "@/components/Icon"
import Empty, { Skeletons } from "@/components/Empty"
import usePageTitle from "@/hooks/usePageTitle"

export default function EchoPage({ params }) {
  usePageTitle("Echo")
  const { id } = use(params)
  const { me } = useAuth()
  const [echo, setEcho] = useState(null)
  const [comments, setComments] = useState([])
  const [error, setError] = useState("")

  const loadComments = useCallback(async () => {
    try {
      setComments((await api(`/api/comments/echo/${id}?limit=100`)).comments)
    } catch {
      /* the echo itself still renders */
    }
  }, [id])

  useEffect(() => {
    api(`/api/echoes/${id}`)
      .then((d) => {
        setEcho(d.echo)
        loadComments()
      })
      .catch((e) => setError(e.message || "Echo not found"))
  }, [id, me?.id, loadComments])

  if (error && !echo) {
    return (
      <Shell>
        <Empty title="Echo unavailable" mascot="no-results">
          {error}
          <div><Link href="/space" className="btn">Back to Space</Link></div>
        </Empty>
      </Shell>
    )
  }
  if (!echo) return <Shell><Skeletons count={1} /></Shell>

  return (
    <Shell>
      <Link href={echo.room ? `/rooms/${echo.room.id}` : "/space"} className="back"><Icon name="back" /> {echo.room ? echo.room.name : "Space"}</Link>
      <EchoCard echo={echo} detail />

      <h2 className="section-title">Replies · {comments.length}</h2>
      {me ? (
        <div className="card"><ReplyForm echo={echo} onPosted={loadComments} /></div>
      ) : (
        <p className="muted" style={{ marginBottom: 12 }}><Link href={`/login?next=/echo/${id}`}>Log in</Link> to reply.</p>
      )}

      {comments.length === 0 && <Empty title="No replies yet" mascot="thinking">Be the first to respond.</Empty>}
      <ReplyThread comments={comments} echo={echo} me={me} reload={loadComments} />
    </Shell>
  )
}
