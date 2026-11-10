"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/components/AuthProvider"
import { useToast } from "@/components/Toast"
import { api } from "@/libs/api"
import Avatar from "@/components/Avatar"
import Ghost from "@/components/Ghost"
import Icon from "@/components/Icon"
import MentionTextarea from "@/components/MentionTextarea"

export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`
  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

const MENTION = /(@[a-z][a-z0-9_]{2,19})/gi

// Turns @username into profile links (React escapes everything else).
export function Body({ text, clamp = false }) {
  return (
    <p className={`echo-body${clamp ? " clamp" : ""}`}>
      {text.split(MENTION).map((part, i) =>
        i % 2 === 1 ? (
          <Link key={i} className="mention" href={`/u/${part.slice(1).toLowerCase()}`}>{part}</Link>
        ) : (
          part
        )
      )}
    </p>
  )
}

export default function EchoCard({ echo: initial, detail = false, onDeleted }) {
  const [echo, setEcho] = useState(initial)
  const { me } = useAuth()
  const toast = useToast()
  const [resonated, setResonated] = useState(!!echo.viewer?.resonated)
  const [saved, setSaved] = useState(!!echo.viewer?.saved)
  const [counts, setCounts] = useState(echo.counts)
  const [ripple, setRipple] = useState(false)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: "", content: "" })
  const [saving, setSaving] = useState(false)

  const long = !detail && echo.content.length > 420
  const clamp = long && !open

  async function toggle(kind) {
    if (!me) {
      toast("Log in to react to echoes")
      return
    }
    if (busy) return
    setBusy(true)
    try {
      const data = await api(`/api/engagement/${kind}`, { method: "POST", body: { echoId: echo.id } })
      if (kind === "resonate") {
        setResonated(data.resonated)
        setCounts((c) => ({ ...c, resonations: data.count }))
        if (data.resonated) {
          setRipple(true)
          setTimeout(() => setRipple(false), 850)
        }
      } else {
        setSaved(data.saved)
        setCounts((c) => ({ ...c, saves: data.count }))
        toast(data.saved ? "Saved" : "Removed from saved")
      }
    } catch (e) {
      toast(e.message, "error")
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    try {
      await api(`/api/echoes/${echo.id}`, { method: "DELETE" })
      toast("Echo deleted")
      if (onDeleted) onDeleted(echo.id)
      else window.location.href = "/home"
    } catch (e) {
      setConfirming(false)
      toast(e.message, "error")
    }
  }

  function startEdit() {
    setDraft({ title: echo.title || "", content: echo.content })
    setEditing(true)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (saving || !draft.content.trim()) return
    setSaving(true)
    try {
      const data = await api(`/api/echoes/${echo.id}`, { method: "PATCH", body: draft })
      setEcho(data.echo)
      setEditing(false)
      toast("Echo updated")
    } catch (err) {
      toast(err.message, "error")
    } finally {
      setSaving(false)
    }
  }

  const name = echo.author?.fullName
  return (
    <article className={`card${detail ? "" : " hoverable"}`}>
      <div className="echo-head">
        <Avatar name={name} anon={!echo.author} seed={echo.author?.username} />
        <div>
          {echo.author ? (
            <Link href={`/u/${echo.author.username}`}><strong>{name}</strong></Link>
          ) : (
            <strong>{echo.isMine ? "You, anonymously" : "Anonymous"}</strong>
          )}
          <div className="meta">
            <time dateTime={new Date(echo.createdAt).toISOString()} title={new Date(echo.createdAt).toLocaleString()}>{timeAgo(echo.createdAt)}</time>
            {echo.editedAt && <span className="edited" title={new Date(echo.editedAt).toLocaleString()}>edited</span>}
            {echo.room && echo.isAnonymous && <span className="chip anon">Anonymous</span>}
            {echo.room ? (
              <Link className="chip" href={`/rooms/${echo.room.id}`}>{echo.room.name}</Link>
            ) : (
              <Link className="chip quiet" href="/space"><Ghost size={14} /> Space</Link>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <form className="reply-form" onSubmit={saveEdit}>
          <input className="input" aria-label="Title" placeholder="Title (optional)" maxLength={120} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          <MentionTextarea className="input" aria-label="Edit your echo" maxLength={5000} required rows={5} value={draft.content} onChange={(content) => setDraft((d) => ({ ...d, content }))} />
          <div className="bar">
            <span className="counter">{draft.content.length}/5000</span>
            <span className="row">
              <button type="button" className="btn quiet small" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn primary small" disabled={saving || !draft.content.trim()}>{saving ? "Saving…" : "Save"}</button>
            </span>
          </div>
        </form>
      ) : (
        <>
          {echo.title && (
            <h3 className="echo-title">{detail ? echo.title : <Link href={`/echo/${echo.id}`}>{echo.title}</Link>}</h3>
          )}
          <Body text={echo.content} clamp={clamp} />
          {long && (
            <button className="readmore" onClick={() => setOpen((o) => !o)}>{open ? "Show less" : "Read more"}</button>
          )}
        </>
      )}

      <div className="echo-actions">
        <button className={`act${resonated ? " on" : ""}${ripple ? " pulse" : ""}`} onClick={() => toggle("resonate")} aria-pressed={resonated} aria-label="Resonate">
          <Icon name="ripple" /> {counts.resonations}
        </button>
        {detail ? (
          <span className="act"><Icon name="comment" /> {counts.comments}</span>
        ) : (
          <Link className="act" href={`/echo/${echo.id}`} aria-label="Replies"><Icon name="comment" /> {counts.comments}</Link>
        )}
        <button className={`act${saved ? " on" : ""}`} onClick={() => toggle("save")} aria-pressed={saved} aria-label="Save">
          <Icon name="bookmark" /> {counts.saves}
        </button>

        {echo.isMine && !editing && !confirming && (
          <button className="act grow" onClick={startEdit} aria-label="Edit echo"><Icon name="edit" /></button>
        )}
        {(echo.isMine || echo.canModerate) && !confirming && (
          <button className={`act${echo.isMine && !editing ? "" : " grow"}`} onClick={() => setConfirming(true)} aria-label="Delete echo"><Icon name="trash" /></button>
        )}
        {(echo.isMine || echo.canModerate) && confirming && (
          <span className="act grow">
            Delete?
            <button className="act confirm" onClick={remove}>Yes</button>
            <button className="act" onClick={() => setConfirming(false)}>No</button>
          </span>
        )}
      </div>
    </article>
  )
}
