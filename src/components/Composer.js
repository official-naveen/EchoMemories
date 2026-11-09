"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { api } from "@/libs/api";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";

// Writes a new echo. `fixedRoomId` locks the destination (room pages).
export default function Composer({
  onPosted,
  fixedRoomId = null,
  defaultSpace = false,
}) {
  const { me } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dest, setDest] = useState(fixedRoomId || "space");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const area = useRef(null);

  useEffect(() => {
    if (open) area.current?.focus();
  }, [open]);

  if (!me) {
    return (
      <div className="card row spread">
        <span className="muted">Log in to share your own echo.</span>
        <Link href="/login" className="btn primary small">
          Log in
        </Link>
      </div>
    );
  }

  const rooms = (me.roomMemberships || []).map((m) => m.room);

  async function submit(e) {
    e?.preventDefault();
    if (busy || !content.trim()) return;
    setError("");
    setBusy(true);
    try {
      const data = await api("/api/echoes", {
        method: "POST",
        body: { title, content, roomId: dest === "space" ? null : dest },
      });
      setTitle("");
      setContent("");
      setOpen(false);
      toast(dest === "space" ? "Sent into Space, anonymously" : "Echo posted");
      onPosted?.(data.echo);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const prompt = defaultSpace
    ? "Say something true. Nobody will know it's you…"
    : "What's echoing in your mind?";

  return (
    <div className="card composer">
      <Avatar name={me.fullName} seed={me.username} />
      {!open ? (
        <button className="composer-prompt" onClick={() => setOpen(true)}>
          {prompt}
        </button>
      ) : (
        <form onSubmit={submit}>
          <input
            className="bare title"
            aria-label="Title"
            placeholder="Title (optional)"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            ref={area}
            className="bare body"
            aria-label="Your echo"
            placeholder="Write freely. Use @username to mention someone."
            maxLength={5000}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) =>
              (e.metaKey || e.ctrlKey) && e.key === "Enter" && submit()
            }
          />
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <div className="composer-bar">
            {fixedRoomId ? (
              <span className="dest">
                <Icon name="rooms" /> Posting to this room
              </span>
            ) : (
              <label className="dest">
                <Icon name={dest === "space" ? "space" : "rooms"} />
                <select
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  aria-label="Post to"
                >
                  <option value="space">Space (anonymous)</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="row">
              <span className="counter">{content.length}/5000</span>
              <button
                type="button"
                className="btn quiet small"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn primary small"
                disabled={busy || !content.trim()}
              >
                {busy ? "Posting…" : "Echo"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
