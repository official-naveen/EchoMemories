"use client"

import { useState } from "react"
import Composer from "@/components/Composer"
import FeedList from "@/components/FeedList"
import Tabs from "@/components/Tabs"
import Shell from "@/components/Shell"
import usePageTitle from "@/hooks/usePageTitle"

export default function Space() {
  usePageTitle("Space")
  const [sort, setSort] = useState("latest")
  const [key, setKey] = useState(0)

  return (
    <Shell wide>
      <h1 className="page-title">Space</h1>
      <p className="page-sub">A universal layer of anonymous echoes. Nobody sees your name here.</p>

      <Composer defaultSpace onPosted={() => { setSort("latest"); setKey((k) => k + 1) }} />

      <Tabs
        value={sort}
        onChange={setSort}
        tabs={[
          { value: "latest", label: "Latest" },
          { value: "discussed", label: "Most discussed" },
          { value: "resonated", label: "Most resonated" },
        ]}
      />
      <FeedList url={`/api/feed/space?sort=${sort}`} reloadKey={key} empty="Space is silent. Be the first echo." />
    </Shell>
  )
}
