import Rail from "@/components/Rail"

// Page layout: content on the left, a quiet sidebar on the right.
export default function Shell({ children, rail = true, wide = false }) {
  return (
    <div className={`shell${rail ? "" : " solo"}${wide ? " wide" : ""}`}>
      <main id="main" className="main">{children}</main>
      {rail && <Rail />}
    </div>
  )
}
