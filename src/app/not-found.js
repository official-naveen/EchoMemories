import Link from "next/link"
import Empty from "@/components/Empty"

export const metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <main id="main" className="shell solo">
      <div className="main">
        <Empty title="This echo faded away" mascot="no-results">
          The page you&rsquo;re looking for doesn&rsquo;t exist.
          <div><Link href="/" className="btn primary">Back to EchoMemories</Link></div>
        </Empty>
      </div>
    </main>
  )
}
