"use client"

// Last-resort boundary for failures in the root layout itself, so it can't rely on app styles.
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#fbfaff", color: "#1e1638", textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#5a5278", marginBottom: 20 }}>Please try again in a moment.</p>
          <button onClick={() => reset()} style={{ background: "#7b52e2", color: "#fff", border: 0, borderRadius: 12, padding: "10px 18px", fontSize: 15, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  )
}
