import Ghost from "@/components/Ghost"

export const metadata = { title: "About" }

export default function About() {
  return (
    <main id="main" className="prose">
      <Ghost size={84} float />
      <h1>EchoMemories</h1>
      <p className="lede">A structured space where voice becomes presence, and presence becomes memory.</p>

      <section>
        <h2>Philosophy</h2>
        <p>EchoMemories is not built for scrolling. It is built for awareness.</p>
        <p>Most platforms reward attention. EchoMemories values resonance.</p>
        <p>Your thoughts are not content. They are signals. Signals deserve structure.</p>
      </section>

      <section>
        <h2>The System</h2>
        <h3>Space</h3>
        <p>A universal layer of anonymous echoes. Public. Permanent. Untouched.</p>
        <h3>EchoRooms</h3>
        <p>Focused communities where context shapes meaning. Rooms deepen conversation.</p>
        <h3>Pulse</h3>
        <p>
          Pulse represents your presence energy within a Space. It grows through interaction: posting, responding,
          being mentioned.
        </p>
        <p>Pulse is public. It reflects how alive you are in a community.</p>
      </section>

      <section>
        <h2>Purpose</h2>
        <p>We change faster than we realize.</p>
        <p>EchoMemories exists to observe change, not chase performance.</p>
        <p>It creates a digital space where presence is visible, and interaction has weight.</p>
      </section>

      <section>
        <h2>Founder</h2>
        <p>
          EchoMemories was created by Naveen Kumar, a BA Hindi (Hons.) student at SGTB Khalsa College, Delhi
          University (North Campus).
        </p>
        <p>
          Currently in his second year, he holds a deep interest in Computer Science and an increasing fascination
          with literature.
        </p>
        <p>
          EchoMemories exists at the intersection of both: code and language, structure and emotion, logic and
          reflection.
        </p>
        <p>
          <a href="https://github.com/official-naveen" target="_blank" rel="noopener noreferrer">GitHub</a>
          {" · "}
          <a href="https://www.linkedin.com/in/naveen-kumar-854737446" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </p>
      </section>
    </main>
  )
}
