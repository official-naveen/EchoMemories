import Link from "next/link"
import Ghost from "@/components/Ghost"
import Icon from "@/components/Icon"

export const metadata = { title: { absolute: "EchoMemories · Say it once. Let it echo." } }

const FEATURES = [
  { icon: "space", title: "Space", text: "An open layer of anonymous echoes. No names, no followers, no performance. Just what is true." },
  { icon: "rooms", title: "EchoRooms", text: "Focused communities where context shapes meaning and conversations go deeper than a comment thread." },
  { icon: "pulse", title: "Pulse", text: "A living score of how present you are: posting, replying, being mentioned and returning every day." },
]

export default function Landing() {
  return (
    <main id="main">
      <section className="hero">
        <div>
          <h1>Say it once. Let it echo.</h1>
          <p className="lead">
            A quiet corner of the internet where thoughts are signals, not content. Write anonymously in Space,
            gather in rooms around what matters, and grow your Pulse by simply showing up.
          </p>
          <div className="row">
            <Link href="/signup" className="btn primary big">Create your account <Icon name="arrow" /></Link>
            <Link href="/space" className="btn big">Peek into Space</Link>
          </div>
        </div>
        <div className="hero-art">
          <Ghost size={360} float priority />
        </div>
      </section>

      <section className="features" aria-label="What you can do">
        {FEATURES.map((f) => (
          <div className="feature" key={f.title}>
            <div className="ficon"><Icon name={f.icon} /></div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>

      <section className="cta">
        <h2>Your voice deserves a room that listens.</h2>
        <p>It takes a minute to join. Pick five rooms and start echoing.</p>
        <Link href="/signup" className="btn primary big">Get started <Icon name="arrow" /></Link>
      </section>
    </main>
  )
}
