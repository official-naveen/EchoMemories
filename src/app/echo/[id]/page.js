"use client"

import { useCallback, useEffect, useState, use } from "react"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import { useToast } from "@/components/Toast"
import { api } from "@/libs/api"
import EchoCard, { timeAgo } from "@/components/EchoCard"
import Shell from "@/components/Shell"
import Avatar from "@/components/Avatar"
import Icon from "@/components/Icon"
import Empty, { Skeletons } from "@/components/Empty"
import usePageTitle from "@/hooks/usePageTitle"

export default function EchoPage({ params }) {
  usePageTitle("Echo")
  const { id } = use(params)
  const { me } = useAuth()
  const toast = useToast()
  const [echo, setEcho] = useState(null)
  const [comments, setComments] = useState([])
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

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

  async function send(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api("/api/comments", { method: "POST", body: { echoId: id, content: text } })
      setText("")
      await loadComments()
      toast("Reply posted")
    } catch (err) {
      toast(err.message, "error")
    } finally {
      setBusy(false)
    }
  }

  async function remove(cid) {
    try {
      await api(`/api/comments/${cid}`, { method: "DELETE" })
      setComments((c) => c.filter((x) => x.id !== cid))
    } catch (err) {
      toast(err.message, "error")
    }
  }

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
        <form className="card stack" onSubmit={send}>
          <textarea className="input" aria-label="Your reply" placeholder="Add a thoughtful reply…" maxLength={1000} required value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn primary small" disabled={busy || !text.trim()} style={{ justifySelf: "end" }}>{busy ? "Sending…" : "Reply"}</button>
        </form>
      ) : (
        <p className="muted" style={{ marginBottom: 12 }}><Link href={`/login?next=/echo/${id}`}>Log in</Link> to reply.</p>
      )}

      {comments.length === 0 && <Empty title="No replies yet" mascot="thinking">Be the first to respond.</Empty>}
      {comments.map((c) => (
        <div key={c.id} className="card">
          <div className="echo-head" style={{ marginBottom: 8 }}>
            <Avatar name={c.author?.fullName} anon={!c.author} seed={c.author?.username} size="sm" />
            <div>
              {c.author ? (
                <Link href={`/u/${c.author.username}`}><strong>{c.author.fullName}</strong></Link>
              ) : (
                <strong>{c.isMine ? "You, anonymously" : "Original poster"}</strong>
              )}
              <div className="meta"><span>{timeAgo(c.createdAt)}</span></div>
            </div>
          </div>
          <p className="echo-body" style={{ fontSize: "1rem" }}>{c.content}</p>
          {(c.isMine || echo.isMine || echo.canModerate) && (
            <div className="echo-actions"><button className="act" onClick={() => remove(c.id)} aria-label="Delete reply"><Icon name="trash" /></button></div>
          )}
        </div>
      ))}
    </Shell>
  )
}
