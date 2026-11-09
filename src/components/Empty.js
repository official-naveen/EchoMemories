import Mascot from "@/components/Mascot"

export default function Empty({ title, mascot = "empty-posts", children }) {
  return (
    <div className="empty">
      <Mascot name={mascot} />
      {title && <strong>{title}</strong>}
      <div>{children}</div>
    </div>
  )
}

export function Skeletons({ count = 3 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="card skel-card" aria-hidden="true">
      <div className="row">
        <div className="skel" style={{ width: 38, height: 38, borderRadius: "50%" }} />
        <div style={{ flex: 1, display: "grid", gap: 6 }}>
          <div className="skel" style={{ height: 12, width: "35%" }} />
          <div className="skel" style={{ height: 10, width: "20%" }} />
        </div>
      </div>
      <div className="skel" style={{ height: 14, width: "95%" }} />
      <div className="skel" style={{ height: 14, width: "88%" }} />
      <div className="skel" style={{ height: 14, width: "60%" }} />
    </div>
  ))
}
