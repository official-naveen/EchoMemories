"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useToast } from "@/components/Toast"
import { api } from "@/libs/api"
import { Body, timeAgo } from "@/components/EchoCard"
import Avatar from "@/components/Avatar"
import ConfirmButton from "@/components/ConfirmButton"
import Icon from "@/components/Icon"
import MentionTextarea from "@/components/MentionTextarea"

// Write a reply to the echo (parentId = null) or to another reply.
export function ReplyForm({ echo, parentId = null, onPosted, onCancel, autoFocus = false }) {
  const toast = useToast()
  const forced = echo.isAnonymous && echo.isMine // the original poster of an anonymous echo stays hidden
  const allowed = echo.room?.allowAnonymous !== false
  const [text, setText] = useState("")
  const [anonymous, setAnonymous] = useState(forced || (echo.isAnonymous && allowed))
  const [busy, setBusy] = useState(false)

  async function send(e) {
    e.preventDefault()
    if (busy || !text.trim()) return
    setBusy(true)
    try {
      await api("/api/comments", {
        method: "POST",
        body: { echoId: echo.id, content: text, parentId, anonymous: allowed && anonymous },
      })
      setText("")
      toast("Reply posted")
      onPosted()
    } catch (err) {
      toast(err.message, "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="reply-form" onSubmit={send}>
      <MentionTextarea
        className="input"
        aria-label={parentId ? "Your reply to this comment" : "Your reply"}
        placeholder={parentId ? "Write a reply…" : "Add a thoughtful reply… use @ to mention someone"}
        maxLength={1000}
        required
        rows={parentId ? 2 : 3}
        autoFocus={autoFocus}
        value={text}
        onChange={setText}
      />
      <div className="bar">
        {allowed ? (
          <label className="check">
            <input type="checkbox" checked={anonymous} disabled={forced} onChange={(e) => setAnonymous(e.target.checked)} />
            {anonymous ? "Anonymous: your name stays hidden" : "Replying under your name"}
          </label>
        ) : (
          <span className="muted">This room doesn&apos;t allow anonymous replies.</span>
        )}
        <span className="row">
          {onCancel && <button type="button" className="btn quiet small" onClick={onCancel}>Cancel</button>}
          <button className="btn primary small" disabled={busy || !text.trim()}>{busy ? "Sending…" : "Reply"}</button>
        </span>
      </div>
    </form>
  )
}

function who(c) {
  if (c.author) return null
  return c.isMine ? "You, anonymously" : c.isOP ? "Original poster" : "Anonymous"
}

function Reply({ c, echo, me, childrenOf, depth, reload }) {
  const toast = useToast()
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const kids = childrenOf.get(c.id) || []
  const canDelete = c.isMine || echo.isMine || echo.canModerate

  async function save(e) {
    e.preventDefault()
    if (saving || !draft.trim()) return
    setSaving(true)
    try {
      await api(`/api/comments/${c.id}`, { method: "PATCH", body: { content: draft } })
      setEditing(false)
      toast("Reply updated")
      reload()
    } catch (err) {
      toast(err.message, "error")
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    try {
      await api(`/api/comments/${c.id}`, { method: "DELETE" })
      reload()
    } catch (err) {
      toast(err.message, "error")
    }
  }

  return (
    <div className="thread-item">
      <div className="card">
        <div className="echo-head" style={{ marginBottom: 8 }}>
          <Avatar name={c.author?.fullName} anon={!c.author} seed={c.author?.username} size="sm" />
          <div>
            {c.author ? (
              <Link href={`/u/${c.author.username}`}><strong>{c.author.fullName}</strong></Link>
            ) : (
              <strong>{who(c)}</strong>
            )}
            {c.author && c.isOP && <span className="chip" style={{ marginLeft: 8 }}>Author</span>}
            <div className="meta">
              <span>{timeAgo(c.createdAt)}</span>
              {c.editedAt && <span className="edited">edited</span>}
            </div>
          </div>
        </div>

        {editing ? (
          <form className="reply-form" onSubmit={save}>
            <MentionTextarea className="input" aria-label="Edit your reply" maxLength={1000} required rows={3} value={draft} onChange={setDraft} />
            <div className="bar">
              <span className="counter">{draft.length}/1000</span>
              <span className="row">
                <button type="button" className="btn quiet small" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn primary small" disabled={saving || !draft.trim()}>{saving ? "Saving…" : "Save"}</button>
              </span>
            </div>
          </form>
        ) : (
          <Body text={c.content} />
        )}

        {!editing && (
          <div className="echo-actions">
            {me && (
              <button className="act" onClick={() => setReplying((r) => !r)} aria-label="Reply to this comment"><Icon name="reply" /> Reply</button>
            )}
            {c.isMine && (
              <button className="act" onClick={() => { setDraft(c.content); setEditing(true) }} aria-label="Edit reply"><Icon name="edit" /></button>
            )}
            {canDelete && (
              <ConfirmButton className="act" confirmLabel="Delete?" onConfirm={remove}><Icon name="trash" /></ConfirmButton>
            )}
          </div>
        )}

        {replying && (
          <ReplyForm echo={echo} parentId={c.id} autoFocus onCancel={() => setReplying(false)} onPosted={() => { setReplying(false); reload() }} />
        )}
      </div>

      {kids.length > 0 && (
        <div className={`thread${depth >= 3 ? " flat" : ""}`}>
          {kids.map((k) => (
            <Reply key={k.id} c={k} echo={echo} me={me} childrenOf={childrenOf} depth={depth + 1} reload={reload} />
          ))}
        </div>
      )}
    </div>
  )
}

// Replies as a tree. Indentation stops after three levels so deep chats stay readable.
export default function ReplyThread({ comments, echo, me, reload }) {
  const { roots, childrenOf } = useMemo(() => {
    const ids = new Set(comments.map((c) => c.id))
    const map = new Map()
    const top = []
    for (const c of comments) {
      if (c.parentId && ids.has(c.parentId)) map.set(c.parentId, [...(map.get(c.parentId) || []), c])
      else top.push(c)
    }
    return { roots: top, childrenOf: map }
  }, [comments])

  return (
    <div className="thread">
      {roots.map((c) => (
        <Reply key={c.id} c={c} echo={echo} me={me} childrenOf={childrenOf} depth={1} reload={reload} />
      ))}
    </div>
  )
}
