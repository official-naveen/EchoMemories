"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "@/libs/api"
import EchoCard from "@/components/EchoCard"
import Empty, { Skeletons } from "@/components/Empty"
import InfiniteSentinel from "@/components/InfiniteSentinel"

// Paginated list of echoes. `url` may already contain a query string.
// Change `reloadKey` to force a refetch (e.g. after posting).
export default function FeedList({ url, reloadKey = 0, empty = "Nothing here yet." }) {
  const [echoes, setEchoes] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const latest = useRef(0)

  const load = useCallback(
    async (p, replace) => {
      const ticket = ++latest.current // ignore answers to outdated requests
      setLoading(true)
      setError("")
      try {
        const data = await api(`${url}${url.includes("?") ? "&" : "?"}page=${p}`)
        if (ticket !== latest.current) return
        setEchoes((prev) => (replace ? data.echoes : [...prev, ...data.echoes]))
        setHasMore(!!data.hasMore)
        setPage(p)
      } catch (e) {
        if (ticket === latest.current) setError(e.message)
      } finally {
        if (ticket === latest.current) setLoading(false)
      }
    },
    [url]
  )

  useEffect(() => {
    load(1, true)
  }, [load, reloadKey])

  return (
    <div>
      <div className="feed-grid">
        {echoes.map((e) => (
          <EchoCard key={e.id} echo={e} onDeleted={(id) => setEchoes((prev) => prev.filter((x) => x.id !== id))} />
        ))}
        {loading && echoes.length === 0 && <Skeletons />}
      </div>
      {error && (
        <Empty title="Couldn’t load echoes" mascot="error">
          {error}
          <div><button className="btn" onClick={() => load(echoes.length ? page : 1, !echoes.length)}>Try again</button></div>
        </Empty>
      )}
      {!loading && !error && echoes.length === 0 && <Empty title="Nothing here yet" mascot="empty-posts">{empty}</Empty>}
      {hasMore && !error && <InfiniteSentinel loading={loading} onVisible={() => load(page + 1, false)} />}
    </div>
  )
}
