"use client"

import Empty from "@/components/Empty"

// Never show raw error text to visitors; the digest lets you find it in the server logs.
export default function Error({ error, reset }) {
  return (
    <main id="main" className="shell solo">
      <div className="main">
        <Empty title="Something went wrong" mascot="error">
          We hit an unexpected problem. Please try again.
          {error?.digest && <div className="muted" style={{ marginTop: 6 }}>Reference: {error.digest}</div>}
          <div><button className="btn primary" onClick={() => reset()}>Try again</button></div>
        </Empty>
      </div>
    </main>
  )
}
