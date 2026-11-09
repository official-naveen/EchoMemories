"use client"

import { useState } from "react"
import { useRequireAuth } from "@/components/AuthProvider"
import Composer from "@/components/Composer"
import FeedList from "@/components/FeedList"
import Tabs from "@/components/Tabs"
import Shell from "@/components/Shell"
import usePageTitle from "@/hooks/usePageTitle"

const FEEDS = {
  rooms: { url: "/api/feed/home", empty: "Your rooms are quiet. Post something, or join more rooms to fill your feed." },
  trending: { url: "/api/feed/trending", empty: "Nothing is trending this week yet. Be the first to spark a conversation." },
  saved: { url: "/api/echoes/saved", empty: "Echoes you save will be kept here for later." },
}

function greeting() {
  const h = new Date().getHours()
  return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
}

export default function Home() {
  usePageTitle("Home")
  const { me } = useRequireAuth()
  const [tab, setTab] = useState("rooms")
  const [key, setKey] = useState(0)

  if (!me) return <Shell wide><div className="skel" style={{ height: 120 }} /></Shell>

  return (
    <Shell wide>
      <h1 className="page-title">{greeting()}, {me.nickname || me.fullName.split(" ")[0]}</h1>
      <p className="page-sub">Here&rsquo;s what&rsquo;s echoing in your rooms today.</p>

      <Composer onPosted={() => { setTab("rooms"); setKey((k) => k + 1) }} />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "rooms", label: "My rooms" },
          { value: "trending", label: "Trending" },
          { value: "saved", label: "Saved" },
        ]}
      />
      <FeedList url={FEEDS[tab].url} empty={FEEDS[tab].empty} reloadKey={key} />
    </Shell>
  )
}
