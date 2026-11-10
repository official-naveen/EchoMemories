"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import { api } from "@/libs/api"
import Avatar from "@/components/Avatar"

// A textarea that suggests people while you type "@name".
// `onChange` receives the new text (not the event). Everything else is passed to the textarea.
const MentionTextarea = forwardRef(function MentionTextarea({ value, onChange, onKeyDown, ...rest }, ref) {
  const area = useRef(null)
  const [token, setToken] = useState(null) // { start, end, query }
  const [users, setUsers] = useState([])
  const [active, setActive] = useState(0)
  useImperativeHandle(ref, () => area.current)

  // Is the caret right after "@something"?
  const readToken = useCallback((el) => {
    const caret = el.selectionStart
    const before = el.value.slice(0, caret)
    const m = /(?:^|[^a-z0-9_])@([a-z0-9_]{0,20})$/i.exec(before)
    setToken(m ? { start: caret - m[1].length - 1, end: caret, query: m[1] } : null)
  }, [])

  useEffect(() => {
    if (!token || !token.query) {
      setUsers([])
      return
    }
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const data = await api(`/api/search/mentions?q=${encodeURIComponent(token.query)}`, { signal: ctrl.signal })
        setUsers(data.users || [])
        setActive(0)
      } catch {
        /* suggestions are optional */
      }
    }, 120)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [token])

  function pick(user) {
    const el = area.current
    const next = `${value.slice(0, token.start)}@${user.username} ${value.slice(token.end)}`
    const caret = token.start + user.username.length + 2
    onChange(next)
    setToken(null)
    setUsers([])
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  function handleKeyDown(e) {
    if (token && users.length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        setActive((a) => (a + (e.key === "ArrowDown" ? 1 : users.length - 1)) % users.length)
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        pick(users[active])
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setToken(null)
        return
      }
    }
    onKeyDown?.(e)
  }

  const open = token && users.length > 0
  return (
    <div className="mention-box">
      <textarea
        {...rest}
        ref={area}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          readToken(e.target)
        }}
        onClick={(e) => readToken(e.target)}
        onKeyUp={(e) => ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) && readToken(e.target)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setToken(null), 150)}
        aria-autocomplete="list"
      />
      {open && (
        <ul className="mention-list" role="listbox">
          {users.map((u, i) => (
            <li key={u.id} role="option" aria-selected={i === active}>
              <button type="button" className={i === active ? "on" : ""} onMouseDown={(e) => { e.preventDefault(); pick(u) }}>
                <Avatar name={u.fullName} seed={u.username} size="sm" />
                <span className="who"><strong>{u.fullName}</strong><span>@{u.username}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

export default MentionTextarea
